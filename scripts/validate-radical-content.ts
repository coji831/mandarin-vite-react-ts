import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RADICALS_FILE = join(__dirname, "../content/radicals/radicals.json");

async function validateRadicalContent(): Promise<void> {
  const raw = await readFile(RADICALS_FILE, "utf-8");
  const radicals: Array<Record<string, unknown>> = JSON.parse(raw);
  let violations = 0;

  for (const entry of radicals) {
    if ("hskCharacters" in entry) {
      console.error(`❌ Violation: radical ${entry.id ?? entry.glyph} contains hskCharacters`);
      violations++;
    }
  }

  if (violations > 0) {
    process.exit(1);
  }
  console.log("✅ All radical entries clean — no hskCharacters found in radicals.json");
}

validateRadicalContent().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
