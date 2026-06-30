/**
 * @file apps/backend/scripts/seed-content-index.js
 * @description Seed script to populate ContentItem table from content/manifest.json.
 * Run: node scripts/seed-content-index.js
 */
import { getContentIndexService } from "../src/shared/infrastructure/content/ContentIndexService.js";

async function main() {
  console.log("Seeding ContentIndex...");
  const service = getContentIndexService();
  const count = await service.syncManifest();
  console.log(`Done. ${count} content items upserted.`);
}

main().catch((err) => {
  console.error("Failed to seed ContentIndex:", err);
  process.exit(1);
});
