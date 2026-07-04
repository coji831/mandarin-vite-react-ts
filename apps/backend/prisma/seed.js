/**
 * @file apps/backend/prisma/seed.js
 * @description Database seed script — single entry point for all reference data.
 *
 * Run via: npx prisma db seed (from apps/backend)
 * Or:       node prisma/seed.js (with DATABASE_URL set)
 *
 * Seeds:
 *   - ContentItem       ← content/manifest.json + content/ files
 *   - PinyinCombination ← hardcoded sample set
 *   - CharacterRadical  ← hardcoded mapping set
 *   - Test users        ← dev only (test@example.com, demo@example.com)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import { seedPinyinCombinations } from "./seeds/seed-pinyin-combinations.js";
import { seedCharacterRadicals } from "./seeds/seed-character-radicals.js";

const { PrismaClient } = prismaPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "content");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── ContentItem seeding (from content/manifest.json) ────────────────────────

const CONTENT_TYPE_PHASE = {
  foundations: 1,
  characters: 2,
  radicals: 2,
  pinyin: 1,
  tones: 1,
  words: 3,
  grammar: 4,
  chengyu: 5,
};

function extractTitle(_type, data) {
  return data.glyph || data.pinyin || data.name || data.id || "Untitled";
}

function extractSubtitle(type, data) {
  if (type === "characters") return data.meaning || data.readings?.[0]?.pinyin || null;
  if (type === "radicals") return `${data.stroke_count} strokes`;
  if (type === "pinyin") return data.category || null;
  if (type === "tones") return `Tone ${data.number}`;
  return null;
}

async function seedContentItems() {
  const manifestPath = path.join(CONTENT_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.log("  ⏭️  No manifest.json found — skipping ContentItem seed");
    return 0;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const contentTypes = manifest.content_types || [];
  let count = 0;

  for (const type of contentTypes) {
    const phaseId = CONTENT_TYPE_PHASE[type];
    if (!phaseId) {
      console.log(`  ⏭️  Unknown type: ${type}`);
      continue;
    }

    const dir = path.join(CONTENT_DIR, type);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      const contentId = file.replace(".json", "");
      const id = `${type}-${contentId}`;

      await prisma.contentItem.upsert({
        where: { id },
        update: {
          title: extractTitle(type, data),
          subtitle: extractSubtitle(type, data),
          phaseId,
        },
        create: {
          id,
          contentType: type,
          contentId,
          phaseId,
          title: extractTitle(type, data),
          subtitle: extractSubtitle(type, data),
        },
      });
      count++;
    }
  }

  return count;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. ContentItem (reference index of all content)
  const contentCount = await seedContentItems();
  console.log(`  ✅ ContentItem: ${contentCount} rows`);

  // 2. Pinyin combinations
  await seedPinyinCombinations(prisma);

  // 3. Character-radical mappings
  await seedCharacterRadicals(prisma);

  // 4. Test users (dev only)
  if (process.env.NODE_ENV !== "production") {
    await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test1234!", 10),
        displayName: "Test User",
      },
    });

    await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        passwordHash: await bcrypt.hash("Demo1234!", 10),
        displayName: "Demo User",
      },
    });

    console.log("  ✅ Test users created");
  } else {
    console.log("  ⏭️  Skipping test users (production)");
  }

  console.log("🎉 Database seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.code || "ERROR", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
