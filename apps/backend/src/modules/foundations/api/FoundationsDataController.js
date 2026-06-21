/**
 * @file apps/backend/src/modules/foundations/api/FoundationsDataController.js
 * @description Controller for foundations data endpoints
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 */

import { readStaticReference } from "../../../shared/infrastructure/data/readStaticReference.js";

export class FoundationsDataController {
  async getPinyinTonesPool(req, res) {
    try {
      const pool = await readStaticReference("foundations/pinyin-tones-pool.json");
      res.json(pool);
    } catch (err) {
      console.error("[FoundationsDataController] Failed to load pinyin-tones pool:", err);
      res.status(500).json({ error: "Failed to load pinyin-tones data" });
    }
  }
}
