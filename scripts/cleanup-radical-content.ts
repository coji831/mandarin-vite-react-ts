import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RADICALS_FILE = join(__dirname, "../content/radicals/radicals.json");

interface RadicalEntry {
  id: string;
  glyph: string;
  hskCharacters?: Array<{ glyph: string; pinyin: string; meaning: string }>;
  [key: string]: unknown;
}

async function cleanupRadicalContent(): Promise<void> {
  const raw = await readFile(RADICALS_FILE, "utf-8");
  const radicals: RadicalEntry[] = JSON.parse(raw);
  let cleaned = 0;

  for (const entry of radicals) {
    if ("hskCharacters" in entry) {
      delete entry.hskCharacters;
      cleaned++;
    }
  }

  await writeFile(RADICALS_FILE, JSON.stringify(radicals, null, 2) + "\n");
  console.log(`✓ Cleaned ${cleaned} radical entries in radicals.json`);
}

cleanupRadicalContent().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
