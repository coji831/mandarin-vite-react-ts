/**
 * @file apps/backend/scripts/health-check.ts
 * @description Comprehensive environment & database health check for new setup debugging and CI.
 *
 * Checks:
 *   - .env.local exists and loads
 *   - DATABASE_URL is set and valid format
 *   - Can connect to database
 *   - Prisma schema has expected models (tables exist)
 *   - Migrations are applied
 *   - Content directory exists
 *   - Key content files are valid JSON
 *   - Important DB tables have data
 *
 * Run: cd apps/backend && npx tsx scripts/health-check.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./client.js";
import { scriptLogger } from "./logger.js";
import { loadEnv } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = scriptLogger("health-check");

// ── Helpers ──────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, "../../..");
const CONTENT_DIR = path.join(REPO_ROOT, "content");

type CheckResult = { label: string; status: "✅" | "⚠️" | "❌"; detail: string };
const results: CheckResult[] = [];

let allPassed = true;

function pass(label: string, detail: string): void {
  results.push({ label, status: "✅", detail });
}

function warn(label: string, detail: string): void {
  results.push({ label, status: "⚠️", detail });
}

function fail(label: string, detail: string): void {
  results.push({ label, status: "❌", detail });
  allPassed = false;
}

// ── Formatting ───────────────────────────────────────────────────────────────

function box(title: string): void {
  const line = "─".repeat(title.length + 4);
  console.log(`┌${line}┐`);
  console.log(`│  ${title}  │`);
  console.log(`└${line}┘\n`);
}

function printResults(): void {
  console.log("\n");
  const header = " Health Check Summary ";
  const line = "═".repeat(header.length + 2);
  console.log(`╔${line}╗`);
  console.log(`║ ${header} ║`);
  console.log(`╚${line}╝\n`);

  const groups = new Map<string, CheckResult[]>();
  for (const r of results) {
    const group = r.label.includes(".") ? r.label.split(".")[0] : "Other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(r);
  }

  for (const [group, items] of groups) {
    console.log(` ${group} ${"─".repeat(Math.max(1, 50 - group.length))}`);
    for (const item of items) {
      console.log(`   ${item.status} ${item.label.replace(`${group}.`, "")}: ${item.detail}`);
    }
    console.log("");
  }

  const finalStatus = allPassed ? "✅ ALL CHECKS PASSED" : "❌ SOME CHECKS FAILED";
  console.log(`Result: ${finalStatus}\n`);
}

// ── Timing helper ────────────────────────────────────────────────────────────

async function timeQuery<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, ms: Math.round(performance.now() - start) };
}

// ── Step 1: Environment ─────────────────────────────────────────────────────

async function checkEnvironment(): Promise<void> {
  box("Environment Health Check");

  // 1a. .env.local exists
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (fs.existsSync(envPath)) {
    const stat = fs.statSync(envPath);
    pass("env", `.env.local found (${envPath}, ${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    fail("env", ".env.local not found at " + envPath);
    return; // Can't check further env items without the file
  }

  // 1b. DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail("env", "DATABASE_URL is not set after loading .env.local");
    return;
  }

  if (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://")) {
    fail(
      "env",
      `DATABASE_URL does not start with postgresql:// (got: ${dbUrl.substring(0, 30)}...)`,
    );
  } else {
    // Extract host safely (mask credentials)
    try {
      const url = new URL(dbUrl);
      const masked = `postgresql://***@${url.hostname}${url.pathname}`;
      pass("env", `DATABASE_URL set (${masked})`);
    } catch {
      pass("env", "DATABASE_URL set (could not parse URL)");
    }
  }

  // 1c. Other key env vars
  if (process.env.NODE_ENV) pass("env", `NODE_ENV=${process.env.NODE_ENV}`);
  if (process.env.JWT_SECRET) pass("env", "JWT_SECRET is set");
  if (process.env.REDIS_URL) pass("env", "REDIS_URL is set (Upstash Redis)");
}

// ── Step 2: Database connection & migrations ─────────────────────────────────

async function checkDatabase(): Promise<void> {
  box("Database Health Check");

  // 2a. Basic connection
  try {
    const { result, ms } = await timeQuery(
      () => prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`,
    );
    pass("db", `Connection OK (${ms}ms)`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fail("db", `Connection failed: ${msg.substring(0, 200)}`);
    return; // Can't check further DB items
  }

  // 2b. Migration count
  try {
    const migrations = await prisma.$queryRaw<
      { count: bigint }[]
    >`SELECT COUNT(*)::bigint as count FROM "_prisma_migrations"`;
    const count = Number(migrations[0]?.count ?? 0);

    if (count > 0) {
      // Get latest migration name
      const latest = await prisma.$queryRaw<
        { migration_name: string }[]
      >`SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 1`;
      const latestName = latest[0]?.migration_name ?? "unknown";
      pass("db", `Migrations: ${count} applied (latest: ${latestName})`);
    } else {
      warn("db", "Migrations: _prisma_migrations table empty (no migrations applied?)");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    warn("db", `Could not check migrations: ${msg.substring(0, 150)}`);
  }
}

// ── Step 3: Schema / table existence ────────────────────────────────────────

async function checkSchema(): Promise<void> {
  box("Schema Health Check");

  const expectedTables = [
    "User",
    "Session",
    "Character",
    "Word",
    "Passage",
    "WordCharacter",
    "WordHskLevel",
    "CharacterHskLevel",
    "CharacterReading",
    "Progress",
    "ReviewLog",
    "CharacterProgress",
    "WordStudyContext",
    "WordLookupEvent",
    "ReadingSession",
    "Bookmark",
    "VocabularyWord",
    "Category",
    "VocabularyList",
    "PhaseGate",
    "ContentItem",
    "PinyinCombination",
    "RadicalProgress",
    "FoundationProgress",
    "MnemonicStory",
    "ReviewItem",
    "QuizAttempt",
    "QuizAttemptAnswer",
    "StudyStreak",
  ];

  // Prisma model names use PascalCase but Postgres table names are snake_case + plural
  // Query information_schema for actual table names
  const tables: string[] = [];
  try {
    const tableRows = await prisma.$queryRaw<
      { table_name: string }[]
    >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`;

    for (const row of tableRows) {
      tables.push(row.table_name);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fail("schema", `Could not query information_schema: ${msg.substring(0, 150)}`);
    return;
  }

  const tableSet = new Set(tables.map((t) => t.toLowerCase()));
  let foundCount = 0;

  for (const model of expectedTables) {
    // Prisma typically uses snake_case + plural: User → users, CharacterProgress → character_progress
    const plausibleNames = [
      model.toLowerCase(), // user
      model.toLowerCase() + "s", // users
      model.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(), // character_progress
      model.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase() + "s", // character_progresses
    ];

    const found = plausibleNames.some((n) => tableSet.has(n));
    if (found) foundCount++;
  }

  if (foundCount > 0) {
    pass("schema", `${foundCount}/${expectedTables.length} models verified in database`);
  } else {
    warn("schema", "Could not match any expected models against database tables");
  }

  // Also print actual table list for debugging
  const tableList = tables.join(", ");
  pass(
    "schema",
    `Tables found: ${tableList.substring(0, 200)}${tableList.length > 200 ? "..." : ""}`,
  );
}

// ── Step 4: Data counts ────────────────────────────────────────────────────

async function checkDataCounts(): Promise<void> {
  box("Data Counts");

  // Prisma uses PascalCase table names matching model names (not snake_case)
  const tablesToCount = [
    { label: "Word", table: "Word" },
    { label: "Character", table: "Character" },
    { label: "WordCharacter", table: "WordCharacter" },
    { label: "WordHskLevel", table: "WordHskLevel" },
    { label: "User", table: "User" },
    { label: "Passage", table: "Passage" },
    { label: "ReviewLog", table: "ReviewLog" },
    { label: "CharacterProgress", table: "CharacterProgress" },
    { label: "Progress", table: "Progress" },
  ];

  for (const { label, table } of tablesToCount) {
    try {
      // Use $queryRawUnsafe for dynamic table identifiers (Prisma parameterizes template literals)
      // Quote table name to preserve case (Postgres folds unquoted identifiers to lowercase)
      const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*)::bigint as count FROM "${table}"`,
      );
      const count = Number(rows[0]?.count ?? 0);
      const padded = String(count).padStart(8);
      if (count > 0) {
        pass("data", `${label}: ${padded} records`);
      } else {
        warn("data", `${label}: ${padded} records (expected — may require user activity)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      warn(
        "data",
        `${label}: could not query (table may not exist yet) — ${msg.substring(0, 100)}`,
      );
    }
  }
}

// ── Step 5: Content files ────────────────────────────────────────────────────

async function checkContentFiles(): Promise<void> {
  box("Content Files");

  const contentFiles = [
    { label: "content/manifest.json", relPath: "manifest.json" },
    { label: "content/words/index.json", relPath: "words/index.json" },
    { label: "content/words/words.json", relPath: "words/words.json" },
    { label: "content/characters/characters.json", relPath: "characters/characters.json" },
  ];

  for (const { label, relPath } of contentFiles) {
    const fullPath = path.join(CONTENT_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      fail("files", `${label}: NOT FOUND`);
      continue;
    }

    const stat = fs.statSync(fullPath);
    const sizeKB = (stat.size / 1024).toFixed(1);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
    const sizeStr = stat.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      JSON.parse(raw); // validate JSON
      pass("files", `${label}: ${sizeStr} (valid JSON)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      fail("files", `${label}: ${sizeStr} (INVALID JSON: ${msg.substring(0, 100)})`);
    }
  }

  // Check manifest.json content
  const manifestPath = path.join(CONTENT_DIR, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (manifest.version !== undefined) {
        pass("files", `content/manifest.json: version ${manifest.version}`);
      }
      if (manifest.entity_counts) {
        const counts = Object.entries(manifest.entity_counts)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ");
        pass("files", `Entity counts: ${counts}`);
      }
    } catch {
      // Already reported above
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Load environment first
  loadEnv();

  const title = " System Health Check ";
  const line = "═".repeat(title.length + 2);
  console.log(`╔${line}╗`);
  console.log(`║ ${title} ║`);
  console.log(`╚${line}╝\n`);

  await checkEnvironment();
  await checkDatabase();
  await checkSchema();
  await checkDataCounts();
  await checkContentFiles();

  printResults();
}

main()
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Unhandled error: ${msg}`);
    allPassed = false;
    process.exit(1);
  })
  .finally(() =>
    prisma.$disconnect().then(() => {
      process.exit(allPassed ? 0 : 1);
    }),
  );
