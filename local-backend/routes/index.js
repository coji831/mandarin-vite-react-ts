// Main router entry point
import express from "express";
import ttsRouter from "../controllers/ttsController.js";
import conversationRouter from "../controllers/conversationController.js";
import healthRouter from "../controllers/healthController.js";

const router = express.Router();

router.use("/get-tts-audio", ttsRouter);
router.use("/mandarin/conversation", conversationRouter);
router.use("/health", healthRouter);

export default router;
