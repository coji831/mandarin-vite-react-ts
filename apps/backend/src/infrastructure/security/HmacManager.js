/**
 * HmacManager
 * Responsible for deriving deterministic HMAC-SHA256 cache keys for examples
 * Reads EXAMPLES_CACHE_HMAC_KEY (required) and EXAMPLES_CACHE_HMAC_KEY_PREVIOUS (optional) from env
 */
import crypto from "crypto";
import { createLogger } from "../../utils/logger.js";

export class HmacManager {
  constructor() {
    this.logger = createLogger("HmacManager");
    this.activeKey = process.env.EXAMPLES_CACHE_HMAC_KEY;
    this.previousKey = process.env.EXAMPLES_CACHE_HMAC_KEY_PREVIOUS || null;

    if (!this.activeKey) {
      throw new Error("EXAMPLES_CACHE_HMAC_KEY environment variable is required");
    }
  }

  /**
   * Derive a deterministic HMAC key for a given input tuple
   * @param {string} word
   * @param {string|number} hskLevel
   * @param {string} language
   * @param {'active'|'previous'} keyVersion
   * @returns {string} hex-encoded HMAC-SHA256 digest
   */
  deriveKey(word, hskLevel, language, keyVersion = "active") {
    const source = `${word}|${hskLevel}|${language}|v1`;
    const key = keyVersion === "previous" && this.previousKey ? this.previousKey : this.activeKey;

    try {
      const h = crypto.createHmac("sha256", key);
      h.update(source);
      const digest = h.digest("hex");
      // Debug log with non-sensitive metadata only
      this.logger.debug("HMAC derived for inputs", { wordLength: (word || "").length, hskLevel, language, keyVersion });
      return digest;
    } catch (err) {
      // Should never happen - treat as fatal
      this.logger.error("HMAC derivation failed", err);
      throw err;
    }
  }
}

export default HmacManager;
