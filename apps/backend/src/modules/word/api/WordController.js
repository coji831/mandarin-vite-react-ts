/**
 * @file apps/backend/src/modules/word/api/WordController.js
 * @description WordController - HTTP-layer controller for vocabulary word operations
 *
 * Clean Architecture: API Layer - handles HTTP mapping only
 * Keep business logic out of controllers. Controllers validate input,
 * call services, and return appropriate HTTP status codes.
 */

/**
 * WordController class with dependency injection
 */
export class WordController {
  /**
   * @param {object} wordService - WordService instance
   */
  constructor(wordService) {
    this.wordService = wordService;

    this.getWord = this.getWord.bind(this);
    this.searchWords = this.searchWords.bind(this);
  }

  /**
   * GET /api/v1/words/:id
   * Get a word by its ID
   */
  async getWord(req, res) {
    try {
      const { id } = req.params;
      const word = await this.wordService.findById(id);
      if (!word) {
        return res.status(404).json({ error: "Word not found" });
      }
      res.json(word);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/words/search?q=...&categories=...&lists=...&limit=...&offset=...
   * Search words with optional filters
   */
  async searchWords(req, res) {
    try {
      const { q, categories, lists, limit, offset } = req.query;
      const filters = {
        ...(categories ? { categories: categories.split(",") } : {}),
        ...(lists ? { lists: lists.split(",") } : {}),
        ...(limit ? { limit: parseInt(limit, 10) } : {}),
        ...(offset ? { offset: parseInt(offset, 10) } : {}),
      };
      const results = await this.wordService.search(q || "", filters);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default WordController;
