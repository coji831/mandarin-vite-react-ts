/**
 * @file apps/backend/prisma/sync-helpers.ts
 * @description Hash-gated delta-sync helpers for the seed pipeline.
 *
 * Replaces the blind `createMany({ skipDuplicates })` / pre-clear+reinsert
 * write paths with a deterministic content-diff:
 *
 *   - `canonicalStringify` / `computeContentHash` — stable SHA-256 per-row hash
 *     over the final DB-bound payload (key-sorted, arrays order-preserved).
 *   - `syncTable` — generic hash-gated sync for Bucket-A tables (per-row
 *     Prisma path for small/medium write-sets, chunked raw `INSERT ... ON
 *     CONFLICT ... DO UPDATE ... WHERE "T"."content_hash" IS DISTINCT FROM
 *     EXCLUDED."content_hash"` for large write-sets).
 *   - `syncDerived` — `SeedCheckpoint`-gated delete+rebuild for Bucket-B
 *     projection tables (no per-row hash).
 *   - `syncGrammar` — Patterns→Examples→Relations in ONE interactive
 *     transaction (all-or-nothing, FK-safe).
 *   - `syncCharacter` — `syncTable` bulk path + the deferred 2-pass phonetic
 *     linking (which does NOT touch `content_hash`).
 *
 * Design: chat-session-resources call_00_GxfOvux0HagEBmB7oBPt3236 (Architect
 * full-pipeline design) + call_00_cIfCVPxkhqvHrygJvPDQ4480 (grammar design).
 *
 * Conventions:
 *   - NULL `content_hash` (post-migration / first run) ⇒ silent reconcile:
 *     write payload + stamp hash, NO `content_version` bump.
 *   - Real change (non-NULL hash differs) ⇒ write + bump `content_version`
 *     ONLY for models that have the column (`hasVersion`).
 *   - Rows in DB but absent from JSON ⇒ log-only (never auto-delete; prune is
 *     opt-in behind `prune: true` and requires an explicit `confirm: true`
 *     gate — `dryRun: true` only previews — and never for Character/Word; the
 *     >5% abort threshold is not yet wired and seed.ts exposes no prune flag,
 *     so prune is currently log-only in practice).
 *   - Bulk writes are per-chunk autocommit — never one long transaction
 *     (Neon pooled `query_wait_timeout=120s`).
 */

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

// ── Tuning constants ──────────────────────────────────────────────────────
// Single-point tuning for the hash-gated sync write paths (Architect-approved
// defaults). Threshold/chunk tweaks should happen here only.
/** Route to the bulk raw-SQL path when the write-set exceeds this. */
const BULK_THRESHOLD = 5_000;
/** Per-batch write sizes: createMany batches, update $transaction batches, bulk raw-SQL statement rows. */
const CHUNK = { create: 5_000, update: 500, bulk: 2_000 };

// ── Types ──────────────────────────────────────────────────────────────────

/** Minimal structural DB handle — accepts `PrismaClient` or `Prisma.TransactionClient`. */
export interface DbClient {
  $transaction: {
    <T>(callback: (tx: any) => Promise<T>, opts?: { timeout?: number }): Promise<T>;
    (actions: unknown[], opts?: { timeout?: number }): Promise<unknown>;
  };
  $executeRaw: (query: Prisma.Sql) => Promise<number>;
  seedCheckpoint: {
    findUnique: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
  };
}

/** One DB-bound row passed to the sync. The key fields live inside the payload. */
export type SyncRow = Record<string, unknown>;

export interface KeySpec {
  /** DB columns that form the sync key, in order. */
  fields: string[];
  /** Stable string for the diff Map key. */
  serialize: (values: unknown[]) => string;
  /** Prisma `where` for a single-row update (compound-unique input for composite keys). */
  uniqueWhere: (values: unknown[]) => Record<string, unknown>;
  /** Column names for the bulk `ON CONFLICT (...)`. */
  conflictTarget: string[];
}

export type BulkCast = "text" | "int" | "bool" | "jsonb" | "text[]";

export interface BulkColumn {
  name: string;
  cast: BulkCast;
}

export interface SyncTableConfig {
  /** Human label used in logs + SeedCheckpoint labels. */
  label: string;
  /** Prisma model delegate name (camelCase), e.g. "grammarPattern". */
  prismaModel: string;
  /** Actual DB table name for raw SQL. Defaults to the Prisma model name. */
  tableName?: string;
  keySpec: KeySpec;
  /** Payload fields entering the content hash (excludes key fields, content_hash, version, timestamps). */
  hashFields: string[];
  /** Bump `content_version` on real change (only models that have the column). */
  hasVersion?: boolean;
  /** Ordered columns for the bulk path (required when |write-set| may exceed the threshold). */
  bulkColumns?: BulkColumn[];
  /** Emit `createdAt`/`updatedAt = CURRENT_TIMESTAMP` in the bulk raw INSERT (raw SQL bypasses Prisma's @updatedAt handling). Only for models that have both columns. */
  bulkTimestamps?: boolean;
  /** Route to the bulk raw-SQL path when the write-set exceeds this. Default 5_000. */
  bulkThreshold?: number;
  chunkSize?: { create?: number; update?: number; bulk?: number };
  txTimeoutMs?: number;
  /** "batch" = $transaction batching (standalone); "interactive" = sequential inside an outer tx. */
  txMode?: "batch" | "interactive";
}

export interface DerivedConfig {
  /** SeedCheckpoint id (must be unique per derived table). */
  label: string;
  prismaModel: string;
}

export interface SyncResult {
  inserted: number;
  updated: number;
  reconciled: number;
  unchanged: number;
  removed: number;
}

export interface SyncOptions {
  log?: (message: string) => void;
  /** Opt-in: report rows present in DB but absent from JSON (see `dryRun`/`confirm`). */
  prune?: boolean;
  /** Preview mode — rows are kept and the would-be deletion is logged, never deleted. */
  dryRun?: boolean;
  /** Explicit confirmation required to actually delete pruned rows. */
  confirm?: boolean;
}

interface ClassifiedRow {
  key: string;
  values: unknown[];
  hash: string;
  payload: Record<string, unknown>;
  /** Only set for `toUpdate` rows (existing non-NULL hash differs). */
  versionBump?: boolean;
  /** Only set for `toReconcile` rows (existing hash was NULL — first-run write). */
  reconciled?: boolean;
}

const defaultLog = (message: string): void => console.log(message);

// ── Deterministic hash ─────────────────────────────────────────────────────

/** Stable, recursive, key-sorted JSON stringify (arrays keep their order). */
export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** SHA-256 hex digest (64 chars) of the canonicalized payload. */
export function computeContentHash(payload: unknown): string {
  return createHash("sha256").update(canonicalStringify(payload)).digest("hex");
}

function pick(payload: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in payload) out[field] = payload[field];
  }
  return out;
}

// ── KeySpec helpers ────────────────────────────────────────────────────────

/** Single-column key (e.g. `id`, `content_id`). */
export function singleKey(field: string): KeySpec {
  return {
    fields: [field],
    serialize: (values) => String(values[0]),
    uniqueWhere: (values) => ({ [field]: values[0] }),
    conflictTarget: [field],
  };
}

/** Two-column composite key with Prisma's compound-unique `where` input. */
export function compositeKey(fieldA: string, fieldB: string): KeySpec {
  const prismaWhereName = `${fieldA}_${fieldB}`;
  return {
    fields: [fieldA, fieldB],
    serialize: (values) => `${String(values[0])}|${String(values[1])}`,
    uniqueWhere: (values) => ({
      [prismaWhereName]: { [fieldA]: values[0], [fieldB]: values[1] },
    }),
    conflictTarget: [fieldA, fieldB],
  };
}

// ── Bulk SQL (raw) ─────────────────────────────────────────────────────────

/** Serialize a `String[]` value into a Postgres array literal (`{"a","b"}`). */
export function toPgArrayLiteral(values: string[]): string {
  const inner = values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  return `{${inner}}`;
}

function valueSql(col: BulkColumn, value: unknown): Prisma.Sql {
  if (value === null || value === undefined) return Prisma.sql`NULL`;
  switch (col.cast) {
    case "jsonb":
      return Prisma.sql`${JSON.stringify(value)}::jsonb`;
    case "text[]":
      return Prisma.sql`${toPgArrayLiteral(value as string[])}::text[]`;
    case "int":
      return Prisma.sql`${Number(value)}`;
    case "bool":
      return Prisma.sql`${Boolean(value)}`;
    default:
      return Prisma.sql`${String(value)}`;
  }
}

/**
 * Build the chunked bulk upsert for the given rows:
 * `INSERT ... ON CONFLICT (key) DO UPDATE SET ... WHERE "T"."content_hash"
 * IS DISTINCT FROM EXCLUDED."content_hash"` — ships only changed rows and
 * returns the actually-written (inserted + updated) count.
 *
 * Exported for unit testing (inspect via `.toQuery()`).
 */
export function buildBulkUpsertQuery(cfg: SyncTableConfig, rows: ClassifiedRow[]): Prisma.Sql {
  const table = cfg.tableName ?? cfg.prismaModel;
  const cols = cfg.bulkColumns ?? [];
  const timestamps = cfg.bulkTimestamps === true;

  const tuples = rows.map((row) => {
    const parts = cols.map((col) => valueSql(col, row.payload[col.name]));
    if (timestamps) {
      // Raw SQL bypasses Prisma, so supply the NOT NULL audit timestamps.
      parts.push(Prisma.sql`CURRENT_TIMESTAMP`, Prisma.sql`CURRENT_TIMESTAMP`);
    }
    return Prisma.sql`(${Prisma.join(parts, ", ")})`;
  });

  const insertCols = cols.map((c) => `"${c.name}"`).join(", ");
  const timestampCols = timestamps ? `, "createdAt", "updatedAt"` : "";
  const conflictCols = cfg.keySpec.conflictTarget.map((c) => `"${c}"`).join(", ");

  const setCols = cols
    .filter((c) => c.name !== "content_hash")
    .map((c) => `"${c.name}" = EXCLUDED."${c.name}"`);
  if (timestamps) {
    // Refresh the audit timestamp on change, but never clobber createdAt.
    setCols.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  }
  if (cfg.hasVersion) {
    setCols.push(
      `"content_version" = CASE WHEN "${table}"."content_hash" IS NOT NULL THEN "${table}"."content_version" + 1 ELSE "${table}"."content_version" END`,
    );
  }
  setCols.push(`"content_hash" = EXCLUDED."content_hash"`);

  return Prisma.sql`
    ${Prisma.raw(`INSERT INTO "${table}" (${insertCols}${timestampCols}) VALUES`)}
    ${Prisma.join(tuples, ", ")}
    ${Prisma.raw(
      `ON CONFLICT (${conflictCols}) DO UPDATE SET ${setCols.join(
        ", ",
      )} WHERE "${table}"."content_hash" IS DISTINCT FROM EXCLUDED."content_hash"`,
    )}
  `;
}

// ── Generic hash-gated sync (Bucket A) ─────────────────────────────────────

/**
 * Diff `rows` (the DB-bound payloads from the authoring JSON) against the
 * stored `content_hash` values and write only the delta. Handles insert /
 * update / NULL-reconcile / unchanged / removed(log-only).
 */
export async function syncTable(
  db: DbClient,
  cfg: SyncTableConfig,
  rows: SyncRow[],
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const log = opts.log ?? defaultLog;
  const model = (db as Record<string, any>)[cfg.prismaModel];
  const keyFields = cfg.keySpec.fields;
  const threshold = cfg.bulkThreshold ?? BULK_THRESHOLD;

  // 1. Read existing hashes only (narrow 2-column scan).
  const select: Record<string, boolean> = { content_hash: true };
  for (const field of keyFields) select[field] = true;
  if (cfg.hasVersion) select.content_version = true;

  const existingRows = await model.findMany({ select });
  const existing = new Map<string, { hash: string | null; version?: number }>();
  for (const row of existingRows) {
    const values = keyFields.map((f) => row[f]);
    existing.set(cfg.keySpec.serialize(values), {
      hash: row.content_hash ?? null,
      version: row.content_version,
    });
  }

  // 2. Classify each authoring row.
  const toInsert: ClassifiedRow[] = [];
  const toUpdate: ClassifiedRow[] = [];
  const toReconcile: ClassifiedRow[] = [];
  const seenKeys = new Set<string>();
  let unchanged = 0;

  for (const payload of rows) {
    const values = keyFields.map((f) => payload[f]);
    const key = cfg.keySpec.serialize(values);
    seenKeys.add(key);
    const hash = computeContentHash(pick(payload, cfg.hashFields));
    const existingRow = existing.get(key);

    if (!existingRow) {
      toInsert.push({ key, values, hash, payload: { ...payload, content_hash: hash } });
    } else if (existingRow.hash === null) {
      // NULL-hash reconcile — write + stamp hash, NO version bump.
      toReconcile.push({
        key,
        values,
        hash,
        payload: { ...payload, content_hash: hash },
        reconciled: true,
      });
    } else if (existingRow.hash !== hash) {
      // Real change — bump version only for models that carry content_version.
      toUpdate.push({
        key,
        values,
        hash,
        payload: { ...payload, content_hash: hash },
        versionBump: cfg.hasVersion,
      });
    } else {
      unchanged++;
    }
  }

  // 3. Rows present in DB but absent from JSON — log-only (prune opt-in).
  const removedKeys = [...existing.keys()].filter((k) => !seenKeys.has(k));
  for (const key of removedKeys) {
    log(`  ⚠️ [${cfg.label}] in DB but not in JSON (kept): ${key}`);
  }

  // 4. Write the delta.
  const toWrite = toInsert.length + toUpdate.length + toReconcile.length;
  let inserted = 0;
  let updated = 0;
  let reconciled = 0;

  if (toWrite > threshold) {
    const bulkRows = [...toInsert, ...toUpdate, ...toReconcile];
    const written = await writeBulk(db, cfg, bulkRows);
    // Bulk conflates insert/update; report the real-write total.
    updated = written;
    log(
      `  ⚡ ${cfg.label}: bulk wrote ${written} rows (${toWrite} delta; ${unchanged} unchanged; ${removedKeys.length} removed-from-JSON)`,
    );
  } else {
    inserted = await writeInserts(db, cfg, toInsert);
    const updateResult = await writeUpdates(db, cfg, [...toUpdate, ...toReconcile]);
    updated = updateResult.updated;
    reconciled = updateResult.reconciled;
    log(
      `  ✅ ${cfg.label}: ${inserted} inserted, ${updated} updated, ${reconciled} reconciled, ${unchanged} unchanged${removedKeys.length ? `, ${removedKeys.length} removed-from-JSON` : ""}`,
    );
  }

  // 5. Removed → prune (opt-in, guarded).
  let removed = 0;
  if (removedKeys.length > 0 && opts.prune) {
    removed = await pruneRemoved(db, cfg, removedKeys, opts);
  }

  return { inserted, updated, reconciled, unchanged, removed };
}

async function writeInserts(
  db: DbClient,
  cfg: SyncTableConfig,
  rows: ClassifiedRow[],
): Promise<number> {
  const model = (db as Record<string, any>)[cfg.prismaModel];
  const chunk = cfg.chunkSize?.create ?? CHUNK.create;
  let total = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk).map((r) => r.payload);
    const result = await model.createMany({ data: batch, skipDuplicates: true });
    total += result.count;
  }
  return total;
}

async function writeUpdates(
  db: DbClient,
  cfg: SyncTableConfig,
  rows: ClassifiedRow[],
): Promise<{ updated: number; reconciled: number }> {
  const model = (db as Record<string, any>)[cfg.prismaModel];
  let updated = 0;
  let reconciled = 0;
  if (rows.length === 0) return { updated, reconciled };

  const buildUpdate = (row: ClassifiedRow) => {
    const where = cfg.keySpec.uniqueWhere(row.values);
    const data: Record<string, unknown> = { ...row.payload };
    if (cfg.hasVersion && row.versionBump) {
      data.content_version = { increment: 1 };
    }
    return model.update({ where, data });
  };

  if (cfg.txMode === "interactive") {
    // Inside an outer interactive transaction — no nested $transaction.
    for (const row of rows) {
      await buildUpdate(row);
      if (row.reconciled) reconciled++;
      else updated++;
    }
  } else {
    const chunk = cfg.chunkSize?.update ?? CHUNK.update;
    for (let i = 0; i < rows.length; i += chunk) {
      const batch = rows.slice(i, i + chunk);
      await db.$transaction(batch.map(buildUpdate), { timeout: cfg.txTimeoutMs ?? 120_000 });
      updated += batch.filter((r) => !r.reconciled).length;
      reconciled += batch.filter((r) => r.reconciled).length;
    }
  }
  return { updated, reconciled };
}

async function writeBulk(
  db: DbClient,
  cfg: SyncTableConfig,
  rows: ClassifiedRow[],
): Promise<number> {
  const chunk = cfg.chunkSize?.bulk ?? CHUNK.bulk;
  let written = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk);
    const query = buildBulkUpsertQuery(cfg, batch);
    const affected = await db.$executeRaw(query);
    written += affected;
  }
  return written;
}

// ── Prune (opt-in, guarded) ────────────────────────────────────────────────

async function pruneRemoved(
  db: DbClient,
  cfg: SyncTableConfig,
  removedKeys: string[],
  opts: SyncOptions,
): Promise<number> {
  const log = opts.log ?? defaultLog;
  // Hard guard: Character/Word have many non-cascading FKs — never prune.
  const neverPrune = cfg.label === "Character" || cfg.label === "Word";
  if (neverPrune) {
    log(`  🛑 [${cfg.label}] prune forbidden (Character/Word never auto-prune) — skipped`);
    return 0;
  }
  if (opts.dryRun === true) {
    // Dry-run preview: report what WOULD be removed without deleting. Deletion
    // requires BOTH prune:true and confirm:true (the explicit "confirm" step).
    log(
      `  🔍 [${cfg.label}] prune dry-run — ${removedKeys.length} rows would be removed (pass confirm: true to delete)`,
    );
    return 0;
  }
  if (opts.confirm !== true) {
    // Prune is log-only by default — rows are kept unless deletion is confirmed.
    // NOTE: seed.ts exposes no prune CLI flag yet and a >5% abort threshold is
    // not wired — so this path is currently log-only in practice.
    log(
      `  ⏭️ [${cfg.label}] prune is log-only by default — ${removedKeys.length} rows kept (pass confirm: true to delete)`,
    );
    return 0;
  }
  const model = (db as Record<string, any>)[cfg.prismaModel];
  const removed: number[] = [];
  for (const key of removedKeys) {
    const values = key.split("|");
    const where = cfg.keySpec.uniqueWhere(values);
    const result = await model.deleteMany({ where });
    removed.push(result.count);
  }
  const total = removed.reduce((a, b) => a + b, 0);
  log(`  🗑️ [${cfg.label}] pruned ${total} rows (confirm: true)`);
  return total;
}

// ── Derived-recompute (Bucket B) ───────────────────────────────────────────

/**
 * SeedCheckpoint-gated delete+rebuild for derived projection tables. The
 * checkpoint is written ONLY after a successful rebuild, so a crash mid-way
 * leaves no checkpoint and the next run re-rebuilds. Identical payload ⇒
 * skip (0 writes).
 */
export async function syncDerived(
  db: DbClient,
  cfg: DerivedConfig,
  rows: SyncRow[],
  opts: SyncOptions = {},
): Promise<{ writes: number; skipped: boolean }> {
  const log = opts.log ?? defaultLog;
  const model = (db as Record<string, any>)[cfg.prismaModel];
  const contentHash = computeContentHash(rows);
  const rowCount = rows.length;

  const checkpoint = await db.seedCheckpoint.findUnique({ where: { id: cfg.label } });
  if (checkpoint && checkpoint.contentHash === contentHash && checkpoint.rowCount === rowCount) {
    log(`  ⏭️ ${cfg.label}: unchanged (checkpoint match, ${rowCount} rows) — 0 writes`);
    return { writes: 0, skipped: true };
  }

  await model.deleteMany();
  const chunk = CHUNK.create;
  let written = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk);
    const result = await model.createMany({ data: batch });
    written += result.count;
  }
  await db.seedCheckpoint.upsert({
    where: { id: cfg.label },
    create: { id: cfg.label, contentHash, rowCount },
    update: { contentHash, rowCount, updatedAt: new Date() },
  });
  log(`  🔁 ${cfg.label}: rebuilt ${written} rows (checkpoint updated)`);
  return { writes: written, skipped: false };
}

// ── Grammar orchestrator (Steps 27–29, one interactive tx) ─────────────────

export interface GrammarExampleRow {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: unknown[];
}

export interface GrammarPatternRow {
  content_id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  examples?: GrammarExampleRow[];
}

export interface GrammarRelationRow {
  fromPatternContentId: string;
  toPatternContentId: string;
  relationType: string;
  metadata?: Record<string, unknown> | null;
}

export interface GrammarFile {
  patterns: GrammarPatternRow[];
  relations: GrammarRelationRow[];
}

/** Map the grammar authoring file into the three DB-bound payload arrays. */
export function mapGrammarRows(grammar: GrammarFile): {
  patterns: SyncRow[];
  examples: SyncRow[];
  relations: SyncRow[];
} {
  return {
    patterns: (grammar.patterns ?? []).map((p) => ({
      content_id: p.content_id,
      name: p.name,
      structure: p.structure,
      explanation: p.explanation,
      phase: p.phase,
      hskLevel: p.hskLevel,
      sortOrder: p.sortOrder,
      metadata: p.metadata ?? null,
    })),
    examples: (grammar.patterns ?? []).flatMap((p) =>
      (p.examples ?? []).map((e) => ({
        content_id: e.content_id,
        patternContentId: p.content_id,
        chinese: e.chinese,
        pinyin: e.pinyin,
        english: e.english,
        segments: e.segments,
        sortOrder: e.sortOrder,
      })),
    ),
    relations: (grammar.relations ?? []).map((r) => ({
      fromPatternContentId: r.fromPatternContentId,
      toPatternContentId: r.toPatternContentId,
      relationType: r.relationType,
      metadata: r.metadata ?? null,
    })),
  };
}

export const grammarPatternCfg: SyncTableConfig = {
  label: "GrammarPattern",
  prismaModel: "grammarPattern",
  keySpec: singleKey("content_id"),
  hashFields: ["name", "structure", "explanation", "phase", "hskLevel", "sortOrder", "metadata"],
  hasVersion: true,
  txMode: "interactive",
};

export const grammarExampleCfg: SyncTableConfig = {
  label: "GrammarExample",
  prismaModel: "grammarExample",
  keySpec: singleKey("content_id"),
  hashFields: ["patternContentId", "chinese", "pinyin", "english", "segments", "sortOrder"],
  hasVersion: true,
  txMode: "interactive",
};

export const grammarRelationCfg: SyncTableConfig = {
  label: "GrammarPatternRelation",
  prismaModel: "grammarPatternRelation",
  keySpec: compositeKey("fromPatternContentId", "toPatternContentId"),
  hashFields: ["relationType", "metadata"],
  hasVersion: true,
  txMode: "interactive",
};

/**
 * Sync the grammar file atomically: Patterns → Examples → Relations inside
 * ONE interactive transaction (a crash can't leave examples pointing at a
 * missing pattern). Returns the per-table diff results.
 */
export async function syncGrammar(
  db: DbClient,
  grammar: GrammarFile,
  opts: SyncOptions = {},
): Promise<{ patterns: SyncResult; examples: SyncResult; relations: SyncResult }> {
  const mapped = mapGrammarRows(grammar);
  const log = opts.log ?? defaultLog;
  let patterns!: SyncResult;
  let examples!: SyncResult;
  let relations!: SyncResult;
  await db.$transaction(
    async (tx) => {
      patterns = await syncTable(tx, grammarPatternCfg, mapped.patterns, { ...opts, log });
      examples = await syncTable(tx, grammarExampleCfg, mapped.examples, { ...opts, log });
      relations = await syncTable(tx, grammarRelationCfg, mapped.relations, { ...opts, log });
    },
    { timeout: 120_000 },
  );
  return { patterns, examples, relations };
}

// ── Character orchestrator (bulk + deferred phonetic linking) ──────────────

export interface Phase2Character {
  id: string;
  glyph: string;
  strokeCount: number;
  classification: string | null;
  etymology: string | null;
  readings: Array<{ pinyin: string; tone: number; type: string; coreMeaning?: string | null }>;
  hskLevel: number | null;
  frequencyRank: number | null;
  commonWords: string[] | null;
  phoneticComponentId: string | null;
  coreMeaning: string | null;
}

/**
 * Map phase2 characters.json rows to the DB-bound Character payload.
 * `phoneticComponentId` is intentionally omitted — it is the deferred 2-pass
 * FK handled by `linkPhoneticComponents` and is EXCLUDED from the content hash.
 */
export function mapCharacterRows(characters: Phase2Character[]): SyncRow[] {
  return characters.map((c) => ({
    id: c.id,
    glyph: c.glyph,
    strokeCount: c.strokeCount ?? 0,
    classification: c.classification,
    hskLevel: c.hskLevel,
    frequencyRank: c.frequencyRank,
    definition: c.coreMeaning || null,
    readings: (c.readings || []).map((r) => ({
      pinyin: r.pinyin,
      tone: r.tone,
      type: r.type,
      meaning: r.coreMeaning || null,
    })),
    etymology: c.etymology,
    commonWords: c.commonWords || [],
  }));
}

export const characterCfg: SyncTableConfig = {
  label: "Character",
  prismaModel: "character",
  tableName: "Character",
  keySpec: singleKey("id"),
  hashFields: [
    "glyph",
    "strokeCount",
    "classification",
    "hskLevel",
    "frequencyRank",
    "definition",
    "readings",
    "etymology",
    "commonWords",
  ],
  hasVersion: true,
  bulkColumns: [
    { name: "id", cast: "text" },
    { name: "glyph", cast: "text" },
    { name: "strokeCount", cast: "int" },
    { name: "classification", cast: "text" },
    { name: "hskLevel", cast: "int" },
    { name: "frequencyRank", cast: "int" },
    { name: "definition", cast: "text" },
    { name: "readings", cast: "jsonb" },
    { name: "etymology", cast: "text" },
    { name: "commonWords", cast: "text[]" },
    { name: "content_hash", cast: "text" },
  ],
  bulkTimestamps: true,
  bulkThreshold: BULK_THRESHOLD,
  chunkSize: { ...CHUNK },
};

/**
 * Deferred 2-pass FK linking: Character.phoneticComponentId → Character.id.
 * Gated on an (id → phoneticComponentId) diff — does NOT touch `content_hash`.
 */
export async function linkPhoneticComponents(
  db: DbClient,
  characters: Phase2Character[],
  opts: SyncOptions = {},
): Promise<number> {
  const log = opts.log ?? defaultLog;
  const withPhonetic = characters.filter((c) => c.phoneticComponentId != null);
  if (withPhonetic.length === 0) return 0;

  const existing = (await (db as Record<string, any>).character.findMany({
    select: { id: true, phoneticComponentId: true },
  })) as Array<{ id: string; phoneticComponentId: string | null }>;
  const existingMap = new Map(existing.map((e) => [e.id, e.phoneticComponentId]));
  const toLink = withPhonetic.filter((c) => existingMap.get(c.id) !== c.phoneticComponentId);
  if (toLink.length === 0) return 0;

  const chunk = CHUNK.update;
  let linked = 0;
  for (let i = 0; i < toLink.length; i += chunk) {
    const batch = toLink.slice(i, i + chunk);
    await db.$transaction(
      batch.map((c) =>
        (db as Record<string, any>).character.update({
          where: { id: c.id },
          data: { phoneticComponentId: c.phoneticComponentId },
        }),
      ),
      { timeout: 120_000 },
    );
    linked += batch.length;
  }
  log(`  🔗 Linked phoneticComponentId for ${linked} characters`);
  return linked;
}

/** Sync Character (bulk hash-gate) then run the deferred phonetic linking pass. */
export async function syncCharacter(
  db: DbClient,
  characters: Phase2Character[],
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const payloads = mapCharacterRows(characters);
  const result = await syncTable(db, characterCfg, payloads, opts);
  await linkPhoneticComponents(db, characters, opts);
  return result;
}

// ── Word config ────────────────────────────────────────────────────────────

export interface Phase2Word {
  id: string;
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  hskLevel: number | null;
  frequencyRank: number | null;
  wordClass: string | null;
}

/** Map phase2 words.json rows to the DB-bound Word payload (strip extra fields). */
export function mapWordRows(words: Phase2Word[]): SyncRow[] {
  return words.map((w) => ({
    id: w.id,
    simplified: w.simplified,
    pinyin: w.pinyin,
    meaning: w.meaning,
    hskLevel: w.hskLevel,
    frequencyRank: w.frequencyRank,
    wordClass: w.wordClass,
  }));
}

export const wordCfg: SyncTableConfig = {
  label: "Word",
  prismaModel: "word",
  tableName: "Word",
  keySpec: singleKey("id"),
  hashFields: ["simplified", "pinyin", "meaning", "hskLevel", "frequencyRank", "wordClass"],
  hasVersion: false,
  bulkColumns: [
    { name: "id", cast: "text" },
    { name: "simplified", cast: "text" },
    { name: "pinyin", cast: "text" },
    { name: "meaning", cast: "text" },
    { name: "hskLevel", cast: "int" },
    { name: "frequencyRank", cast: "int" },
    { name: "wordClass", cast: "text" },
    { name: "content_hash", cast: "text" },
  ],
  bulkTimestamps: true,
  bulkThreshold: BULK_THRESHOLD,
  chunkSize: { ...CHUNK },
};

// ── Small / composite Bucket-A table configs (Phase 2) ─────────────────────
// Each payload is the DB-bound mapping the seed produces (see seed.ts). Key
// fields (id / composite pair) never enter the content hash.

export const radicalCfg: SyncTableConfig = {
  label: "Radical",
  prismaModel: "radical",
  keySpec: singleKey("id"),
  hashFields: [
    "glyph",
    "alternateGlyphs",
    "namePinyin",
    "nameChinese",
    "meaning",
    "strokeCount",
    "isRecommended",
    "kangxiIndex",
    "etymology",
    "frequencyRank",
    "notes",
    "isAlsoCharacter",
    "variants",
  ],
};

export const toneCfg: SyncTableConfig = {
  label: "Tone",
  prismaModel: "tone",
  keySpec: singleKey("id"),
  hashFields: [
    "number",
    "name",
    "mark",
    "contour",
    "pitchDescription",
    "exampleSyllable",
    "exampleCharacter",
    "color",
    "pronunciationGuide",
    "commonIssues",
  ],
};

export const pinyinPhonemeCfg: SyncTableConfig = {
  label: "PinyinPhoneme",
  prismaModel: "pinyinPhoneme",
  keySpec: singleKey("id"),
  hashFields: [
    "pinyin",
    "phonemeType",
    "type",
    "category",
    "ipa",
    "description",
    "mouthPosition",
    "voiced",
    "aspirated",
    "toneVariants",
    "pronunciationGuide",
    "commonIssues",
  ],
};

export const tonePairCfg: SyncTableConfig = {
  label: "TonePair",
  prismaModel: "tonePair",
  keySpec: singleKey("id"),
  hashFields: ["chinese", "dictionaryPinyin", "spokenPinyin", "rule", "pattern"],
};

export const toneRuleCfg: SyncTableConfig = {
  label: "ToneRule",
  prismaModel: "toneRule",
  keySpec: singleKey("id"),
  hashFields: ["title", "rule", "examples"],
};

export const pinyinSyllableCfg: SyncTableConfig = {
  label: "PinyinSyllable",
  prismaModel: "pinyinSyllable",
  keySpec: singleKey("id"),
  hashFields: ["initial", "final", "tone", "syllable", "syllablePretty", "isStandard"],
};

export const measureWordCfg: SyncTableConfig = {
  label: "MeasureWord",
  prismaModel: "measureWord",
  keySpec: singleKey("id"),
  hashFields: ["simplified", "pinyin", "meaning", "category", "usageNote"],
};

export const componentCfg: SyncTableConfig = {
  label: "Component",
  prismaModel: "component",
  keySpec: singleKey("id"),
  hashFields: ["glyph", "meaning", "type", "variantOf", "strokes"],
};

export const passageCfg: SyncTableConfig = {
  label: "Passage",
  prismaModel: "passage",
  keySpec: singleKey("id"),
  hashFields: [
    "hskLevel",
    "passageIndex",
    "title",
    "content",
    "wordCount",
    "knownWordRatio",
    "targetHskLevel",
  ],
};

export const strokeCategoryCfg: SyncTableConfig = {
  label: "StrokeCategory",
  prismaModel: "strokeCategory",
  keySpec: singleKey("id"),
  hashFields: ["name", "pinyin", "meaning", "glyph", "order", "strokeCount", "exampleChars"],
};

export const strokeExtendedTypeCfg: SyncTableConfig = {
  label: "StrokeExtendedType",
  prismaModel: "strokeExtendedType",
  keySpec: singleKey("id"),
  hashFields: ["name", "pinyin", "meaning", "glyph", "baseCategoryId", "order"],
};

export const strokeOrderRuleCfg: SyncTableConfig = {
  label: "StrokeOrderRule",
  prismaModel: "strokeOrderRule",
  keySpec: singleKey("id"),
  hashFields: ["number", "name", "description", "examples"],
};

export const strokeCategoryOrderRuleCfg: SyncTableConfig = {
  label: "StrokeCategoryOrderRule",
  prismaModel: "strokeCategoryOrderRule",
  keySpec: compositeKey("categoryId", "ruleId"),
  hashFields: ["priority"],
};

export const phoneticClusterCfg: SyncTableConfig = {
  label: "PhoneticCluster",
  prismaModel: "phoneticCluster",
  keySpec: singleKey("id"),
  hashFields: ["componentId", "displayOrder", "description", "pronunciationNote", "phoneticPinyin"],
};

export const characterRadicalCfg: SyncTableConfig = {
  label: "CharacterRadical",
  prismaModel: "characterRadical",
  keySpec: compositeKey("characterGlyph", "radicalId"),
  hashFields: ["characterId", "decompositionType"],
};

export const measureWordWordCfg: SyncTableConfig = {
  label: "MeasureWordWord",
  prismaModel: "measureWordWord",
  keySpec: compositeKey("measureWordId", "wordId"),
  hashFields: ["exampleSentence", "isDefault"],
};

// ── Derived (Bucket-B) configs — SeedCheckpoint-gated rebuild, no per-row hash ──

export const derivedConfigs: Record<string, DerivedConfig> = {
  characterReading: { label: "CharacterReading", prismaModel: "characterReading" },
  characterHskLevel: { label: "CharacterHskLevel", prismaModel: "characterHskLevel" },
  wordHskLevel: { label: "WordHskLevel", prismaModel: "wordHskLevel" },
  wordCharacter: { label: "WordCharacter", prismaModel: "wordCharacter" },
  pinyinCharacterMapping: {
    label: "PinyinCharacterMapping",
    prismaModel: "pinyinCharacterMapping",
  },
  characterComponent: { label: "CharacterComponent", prismaModel: "characterComponent" },
  phoneticClusterMember: { label: "PhoneticClusterMember", prismaModel: "phoneticClusterMember" },
};

/** Map phase2 word-hsk-levels.json rows to the DB-bound payload (hskVersion defaults to "3.0"). */
export function mapWordHskLevels(
  rows: Array<{ wordId: string; hskLevel: number; hskVersion?: string | null }>,
): SyncRow[] {
  return rows.map((r) => ({
    wordId: r.wordId,
    hskLevel: r.hskLevel,
    hskVersion: r.hskVersion || "3.0",
  }));
}
