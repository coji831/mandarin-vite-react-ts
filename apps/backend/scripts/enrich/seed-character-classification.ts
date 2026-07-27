/**
 * @file apps/backend/scripts/database/seed-character-classification.ts
 * @description Populate Character.classification from etymology data in content files.
 *
 * Reads character JSON files from content/characters/, infers classification from
 * etymology keywords, and updates the Character.classification field in the DB.
 *
 * Classification values: "pictograph" | "ideograph" | "phono_semantic" | "compound_ideograph" | null
 *
 * Inference rules:
 *   - "pictograph" / "Originally pictograph" → "pictograph"
 *   - "Phonetic-semantic" / "Pictophonetic" → "phono_semantic"
 *   - "Compound ideograph" / "Associative compound" / "Complex compound" → "compound_ideograph"
 *   - No match → null
 *
 * Idempotent: safe to re-run.
 *
 * Run: npx tsx scripts/database/seed-character-classification.ts (from apps/backend)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");
const CHARS_DIR = path.join(CONTENT_DIR, "characters");

/**
 * Infer character classification from etymology text.
 */
function inferClassification(etymology: string | null | undefined): string | null {
  if (!etymology) return null;

  const lower = etymology.toLowerCase();

  // Check for pictograph patterns first
  if (lower.includes("pictograph") || lower.startsWith("originally pictograph")) {
    return "pictograph";
  }

  // Check for phono_semantic patterns
  if (
    lower.includes("phonetic-semantic") ||
    lower.includes("pictophonetic") ||
    lower.includes("phono-semantic")
  ) {
    return "phono_semantic";
  }

  // Check for compound_ideograph patterns
  if (
    lower.includes("compound ideograph") ||
    lower.includes("associative compound") ||
    lower.includes("complex compound")
  ) {
    return "compound_ideograph";
  }

  // Check for simple ideograph
  if (lower.includes("ideograph")) {
    return "ideograph";
  }

  return null;
}

/**
 * Read character JSON files from content/characters/ and infer classification.
 * Returns a map of glyph → classification.
 */
function loadClassificationMap(): Map<string, string | null> {
  const files = fs
    .readdirSync(CHARS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "characters.json" && f !== "index.json");

  const classificationMap = new Map<string, string | null>();

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(CHARS_DIR, file), "utf-8"));
    const etymology = raw.metadata?.etymology ?? raw.etymology ?? null;
    const classification = inferClassification(etymology);

    if (classification) {
      classificationMap.set(raw.glyph, classification);
    }
  }

  return classificationMap;
}

/**
 * Populate Character.classification from content file etymology data.
 * Accepts prisma client for use as part of a larger seed process.
 */
export async function seedCharacterClassification(prisma: {
  character: {
    findMany: (args: {
      select: Record<string, boolean>;
    }) => Promise<Array<{ id: string; glyph: string; classification: string | null }>>;
    update: (args: {
      where: { id: string };
      data: { classification: string | null };
    }) => Promise<unknown>;
  };
}): Promise<number> {
  console.log("  📖 Loading classification data from content files...");
  const classificationMap = loadClassificationMap();
  console.log(`  📄 Found ${classificationMap.size} classifications in content files`);

  // Fetch all characters from DB
  const characters = await prisma.character.findMany({
    select: { id: true, glyph: true, classification: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const char of characters) {
    const classification = classificationMap.get(char.glyph) ?? null;

    // Skip if classification is already set and hasn't changed
    if (char.classification === classification) {
      skipped++;
      continue;
    }

    await prisma.character.update({
      where: { id: char.id },
      data: { classification },
    });
    updated++;
  }

  console.log(`  ✅ Updated ${updated} characters, ${skipped} already current`);
  return updated;
}

// ── Standalone entry point ──────────────────────────────────────────────────

async function main(): Promise<void> {
  // Load dotenv for standalone execution (same path as prisma.config.ts)
  const dotenv = (await import("dotenv")).default;
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });

  console.log("📦 Seeding character classifications...");

  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");

  const dbUrl = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaPg({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.slice(1),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    ssl: { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const count = await seedCharacterClassification(prisma);
    console.log(`🎉 Done! ${count} characters classified`);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow standalone execution
const isStandalone =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isStandalone) {
  main().catch((e: Error) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  });
}
