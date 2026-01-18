import express from "express";
import VocabularyController from "../controllers/VocabularyController.js";

export function createVocabularyRouter(vocabularyService, progressService) {
  const router = express.Router();
  const controller = new VocabularyController(vocabularyService, progressService);

  router.get("/vocabulary/lists", controller.listVocabularyLists);
  router.get("/vocabulary/lists/:listId", controller.getVocabularyList);
  router.get("/vocabulary/lists/:listId/words", controller.getWordsForList);
  router.get("/vocabulary/lists/:listId/progress", controller.getListProgress);
  router.get("/vocabulary/search", controller.searchLists);

  return router;
}

export default createVocabularyRouter;
