import express from "express";

/**
 * VocabularyController
 * HTTP-layer controller responsible solely for mapping HTTP requests to
 * core `VocabularyService` operations and formatting responses.
 *
 * Keep business logic out of controllers. Controllers should validate input,
 * call services, and return appropriate HTTP status codes.
 */
export class VocabularyController {
  constructor(vocabularyService, progressService) {
    this.vocabularyService = vocabularyService;
    this.progressService = progressService;

    // bind methods so we can use them directly as Express handlers
    this.listVocabularyLists = this.listVocabularyLists.bind(this);
    this.getVocabularyList = this.getVocabularyList.bind(this);
    this.getWordsForList = this.getWordsForList.bind(this);
    this.getListProgress = this.getListProgress.bind(this);
    this.searchLists = this.searchLists.bind(this);
  }

  /**
   * GET /api/v1/vocabulary/lists
   */
  async listVocabularyLists(req, res) {
    try {
      const lists = await this.vocabularyService.getAllLists();
      res.json(lists);
    } catch (err) {
      // Controller-level error handling: return a 500 with message
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/vocabulary/lists/:listId
   */
  async getVocabularyList(req, res) {
    try {
      const { listId } = req.params;
      const list = await this.vocabularyService.getListById(listId);
      if (!list) return res.status(404).json({ error: "List not found" });
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/vocabulary/lists/:listId/words
   */
  async getWordsForList(req, res) {
    try {
      const { listId } = req.params;
      const words = await this.vocabularyService.getWordsForList(listId);
      res.json(words);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/vocabulary/lists/:listId/progress
   * Requires authentication middleware to set `req.userId` when used.
   */
  async getListProgress(req, res) {
    try {
      const { listId } = req.params;
      const userId = req.userId || null;

      // Controller composes multiple service calls but contains no business logic
      const list = await this.vocabularyService.getListById(listId);
      const words = await this.vocabularyService.getWordsForList(listId);
      const wordIds = words.map((w) => w.wordId);

      const stats = await this.progressService.calculateMasteryStats(userId, listId, wordIds);

      res.json({ listId, listName: list?.name, ...stats });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/v1/vocabulary/search?q=...&difficulty=...&tags=tag1,tag2
   */
  async searchLists(req, res) {
    try {
      const { q, difficulty, tags } = req.query;
      const filters = {
        difficulties: difficulty ? [difficulty] : undefined,
        tags: tags ? tags.split(",") : undefined,
      };
      const results = await this.vocabularyService.searchLists(q, filters);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default VocabularyController;
