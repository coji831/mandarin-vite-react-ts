/**
 * @file apps/backend/tests/integration/quiz-format-seed.test.ts
 * @description DB-backed integration tests for the Epic 26 curated quiz banks
 * (Story 26-7, design.md §26.4.3). Covers:
 *   - anchor resolution — every authored item names a `GrammarExample` or
 *     `Character` row that already exists, and lands in that row's
 *     `metadata.quizFormats[]`,
 *   - idempotency — a second run of the loader writes 0 rows,
 *   - schema shape — the stored items keep the selection-layer shape (anchor
 *     reference + index only; never the answer text),
 *   - dangling-id failure — an authored id with no anchor throws BEFORE writing,
 *   - manifest agreement — the file's `entries`/`sha256` match the manifest and
 *     each bank's item count matches the number of anchors carrying it.
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration -- tests/integration/quiz-format-seed.test.ts
 * When no DB is reachable the suite is skipped.
 *
 * The loader is idempotent and only fills the anchors' existing `metadata`
 * column, so running this suite leaves the DB in exactly the state a real seed
 * produces (no rows created, no rows deleted).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import crypto from "node:crypto";
import { fileURLToPath } from "url";
import { prisma } from "../../src/shared/infrastructure/database/client.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { syncQuizFormats } from "../../prisma/sync-helpers.js";
import type { QuizFormatSeedResult } from "../../prisma/sync-helpers.js";

const db = await checkDatabase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_FILE = path.resolve(__dirname, "../../../../content/seed/phase2/quiz-formats.json");
const MANIFEST_FILE = path.resolve(__dirname, "../../../../content/seed/manifest.json");

interface BankItem {
  id: string;
  exampleContentId?: string;
  characterId?: string;
  blankSegmentIndex?: number;
  targetSegmentIndex?: number;
  ruleId?: string;
  phase?: number;
}

interface BankFile {
  _comment?: string;
  banks: Record<string, BankItem[]>;
}

/** Fields a selection-layer item is allowed to carry — NEVER the answer text. */
const ALLOWED_ITEM_KEYS = new Set([
  "id",
  "format",
  "exampleContentId",
  "characterId",
  "blankSegmentIndex",
  "targetSegmentIndex",
  "ruleId",
  "phase",
]);

const rawBankFile = fs.readFileSync(BANK_FILE);
const bankFile = JSON.parse(rawBankFile.toString("utf-8")) as BankFile;
const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8")) as {
  generatedAt: string;
  phase2: Record<string, { entries: number; sha256: string }>;
};

const BANK_FORMATS = Object.keys(bankFile.banks);
const ITEM_COUNT = BANK_FORMATS.reduce((total, format) => total + bankFile.banks[format].length, 0);

/** Every item with its bank key attached, in authored order. */
const authoredItems = BANK_FORMATS.flatMap((format) =>
  bankFile.banks[format].map((item) => ({ ...item, format })),
);

/** Read the stored bank items for one anchor row. */
function storedItems(metadata: unknown, format: string): Array<Record<string, unknown>> {
  if (!metadata || typeof metadata !== "object") return [];
  const value = (metadata as Record<string, unknown>).quizFormats;
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) &&
      typeof entry === "object" &&
      (entry as { format?: unknown }).format === format,
  );
}

describe.skipIf(!db.available)("Epic 26 curated quiz banks (integration, DB)", () => {
  let firstRun: QuizFormatSeedResult;
  let secondRun: QuizFormatSeedResult;

  beforeAll(async () => {
    firstRun = await syncQuizFormats(prisma, bankFile);
    secondRun = await syncQuizFormats(prisma, bankFile);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("resolves every authored anchor and stores its item on that row", async () => {
    expect(firstRun.itemsPerFormat).toEqual(
      Object.fromEntries(BANK_FORMATS.map((format) => [format, bankFile.banks[format].length])),
    );

    for (const format of BANK_FORMATS) {
      const isCharacterBank = format === "listening-dictation";
      const rows = isCharacterBank
        ? await prisma.character.findMany({
            where: {
              id: {
                in: authoredItems.filter((i) => i.format === format).map((i) => i.characterId!),
              },
            },
            select: { id: true, metadata: true },
          })
        : await prisma.grammarExample.findMany({
            where: {
              content_id: {
                in: authoredItems
                  .filter((i) => i.format === format)
                  .map((i) => i.exampleContentId!),
              },
            },
            select: { content_id: true, metadata: true },
          });

      expect(rows).toHaveLength(bankFile.banks[format].length);

      for (const row of rows as Array<{ id?: string; content_id?: string; metadata: unknown }>) {
        const anchorId = row.id ?? row.content_id;
        const expected = authoredItems.filter(
          (item) =>
            item.format === format &&
            (isCharacterBank ? item.characterId === anchorId : item.exampleContentId === anchorId),
        );
        expect(expected).toHaveLength(1);
        expect(storedItems(row.metadata, format).map((item) => item.id)).toEqual([expected[0].id]);
      }
    }
  });

  it("is idempotent — the second run writes 0 rows", () => {
    expect(secondRun.writes).toBe(0);
    expect(secondRun.itemsPerFormat).toEqual(firstRun.itemsPerFormat);
    expect(secondRun.anchorsPerFormat).toEqual(firstRun.anchorsPerFormat);
  });

  it("treats a file with no banks as a no-op (the absent-file path returns before this)", async () => {
    await expect(syncQuizFormats(prisma, {})).resolves.toEqual({
      writes: 0,
      itemsPerFormat: {},
      anchorsPerFormat: {},
    });
  });

  it("keeps the selection-layer schema shape — anchors and indices only, never answers", async () => {
    for (const format of BANK_FORMATS) {
      const isCharacterBank = format === "listening-dictation";
      const rows = isCharacterBank
        ? await prisma.character.findMany({
            where: { metadata: { path: ["quizFormats"], array_contains: [{ format }] } },
            select: { id: true, metadata: true },
          })
        : await prisma.grammarExample.findMany({
            where: { metadata: { path: ["quizFormats"], array_contains: [{ format }] } },
            select: { content_id: true, metadata: true },
          });

      expect(rows.length).toBeGreaterThan(0);

      for (const row of rows as Array<{ metadata: unknown }>) {
        const items = storedItems(row.metadata, format);
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          expect(typeof item.id).toBe("string");
          expect(item.format).toBe(format);
          // The bank is a SELECTION: no answer/segment text may be duplicated in.
          for (const key of Object.keys(item)) {
            expect(ALLOWED_ITEM_KEYS.has(key), `unexpected bank item key "${key}"`).toBe(true);
          }
          // Exactly one anchor reference (the seed rejects both/neither).
          const anchors = [item.exampleContentId, item.characterId].filter(
            (value) => typeof value === "string",
          );
          expect(anchors).toHaveLength(1);
        }
      }
    }
  });

  it("fails loudly on a dangling anchor id and writes nothing", async () => {
    const before = await prisma.grammarExample.findMany({
      where: { metadata: { path: ["quizFormats"], array_contains: [{ format: "cloze" }] } },
      select: { content_id: true, metadata: true },
      orderBy: { content_id: "asc" },
    });

    await expect(
      syncQuizFormats(prisma, {
        banks: { cloze: [{ id: "clz_9999", exampleContentId: "gr_9999_ex1" }] },
      }),
    ).rejects.toThrow(/dangling anchor id/);

    await expect(
      syncQuizFormats(prisma, {
        banks: { "listening-dictation": [{ id: "dct_9999", characterId: "ch_999999" }] },
      }),
    ).rejects.toThrow(/dangling anchor id/);

    const after = await prisma.grammarExample.findMany({
      where: { metadata: { path: ["quizFormats"], array_contains: [{ format: "cloze" }] } },
      select: { content_id: true, metadata: true },
      orderBy: { content_id: "asc" },
    });
    expect(after).toEqual(before);
  });

  it("drops an item that is no longer authored, and restores on the real file", async () => {
    const anchorId = bankFile.banks.cloze[0].exampleContentId!;

    try {
      await syncQuizFormats(prisma, {
        banks: {
          cloze: [
            { id: bankFile.banks.cloze[0].id, exampleContentId: anchorId, blankSegmentIndex: 0 },
          ],
        },
      });
      const narrowed = await prisma.grammarExample.findUnique({
        where: { content_id: anchorId },
        select: { metadata: true },
      });
      expect(storedItems(narrowed?.metadata, "cloze").map((item) => item.id)).toEqual([
        bankFile.banks.cloze[0].id,
      ]);
    } finally {
      await syncQuizFormats(prisma, bankFile);
    }

    const restored = await syncQuizFormats(prisma, bankFile);
    expect(restored.writes).toBe(0);
  });

  it("matches the manifest entry — item count and file hash", async () => {
    const entry = manifest.phase2["quiz-formats.json"];
    expect(entry).toBeDefined();
    expect(entry.entries).toBe(ITEM_COUNT);
    expect(entry.sha256).toBe(crypto.createHash("sha256").update(rawBankFile).digest("hex"));
    expect(new Date(manifest.generatedAt).getTime()).not.toBeNaN();
  });

  it("matches each bank's item count against the anchors carrying it", async () => {
    for (const format of BANK_FORMATS) {
      const isCharacterBank = format === "listening-dictation";
      const stored = isCharacterBank
        ? await prisma.character.count({
            where: { metadata: { path: ["quizFormats"], array_contains: [{ format }] } },
          })
        : await prisma.grammarExample.count({
            where: { metadata: { path: ["quizFormats"], array_contains: [{ format }] } },
          });

      expect(stored, `${format}: stored anchors`).toBe(bankFile.banks[format].length);
      expect(firstRun.anchorsPerFormat[format]).toBe(bankFile.banks[format].length);
    }
  });

  it("serves the banked anchors through the real generators (read path)", async () => {
    const {
      clozeStrategy,
      sentenceBuildingStrategy,
      listeningDictationStrategy,
      toneJudgmentStrategy,
    } = await import("../../src/modules/quiz/strategies/index.js");

    // ── cloze: only the banked examples, each blanking its pinned segment ──
    const cloze = await clozeStrategy.generateQuestions();
    expect(new Set(cloze.map((question) => question.id))).toEqual(
      new Set(bankFile.banks.cloze.map((item) => `cloze-${item.exampleContentId}`)),
    );
    const clozeExamples = await prisma.grammarExample.findMany({
      where: { content_id: { in: bankFile.banks.cloze.map((item) => item.exampleContentId!) } },
      select: { content_id: true, segments: true },
    });
    for (const question of cloze) {
      const example = clozeExamples.find((row) => `cloze-${row.content_id}` === question.id)!;
      const segments = example.segments as Array<{ text: string }>;
      expect(question.correctPinyin).toBe(segments[question.blankIndex].text);
      expect(question.blankIndex).toBe(
        bankFile.banks.cloze.find((item) => `cloze-${item.exampleContentId}` === question.id)!
          .blankSegmentIndex,
      );
    }

    // ── sentence-building: only the banked examples ──
    const building = await sentenceBuildingStrategy.generateQuestions();
    expect(new Set(building.map((question) => question.id))).toEqual(
      new Set(bankFile.banks["sentence-building"].map((item) => `sbo-${item.exampleContentId}`)),
    );

    // ── listening-dictation: the bank's characters (capped at questionCount) ──
    const dictation = await listeningDictationStrategy.generateQuestions();
    const bankedCharacters = new Set(
      bankFile.banks["listening-dictation"].map((item) => item.characterId),
    );
    expect(dictation).toHaveLength(listeningDictationStrategy.questionCount);
    for (const question of dictation) {
      expect(bankedCharacters.has(question.id.replace(/^dct-/, ""))).toBe(true);
      expect(question.audioKey).toBe(question.character);
    }

    // ── tone-judgment: the banked examples, surface tone DERIVED from the rule ──
    const toneJudgment = await toneJudgmentStrategy.generateQuestions();
    expect(toneJudgment).toHaveLength(bankFile.banks["tone-judgment"].length);
    for (const question of toneJudgment) {
      expect(question.ruleId).toBe("rule-3rd-sandhi");
      expect(question.category).toBe("tone-judgment");
      // 3rd tone before a 3rd tone surfaces as the 2nd; the bank only pins
      // genuine 3-3 pairs, so every item is a real sandhi question.
      expect(question.baseTone).toBe(3);
      expect(question.correctTone).toBe(2);
      expect(question.audioKey).toBe("");
    }
  });
});
