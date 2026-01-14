// Main router entry point
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import express from "express";

import conversationRouter from "../controllers/conversationController.js";
import healthRouter from "../controllers/healthController.js";
import ttsRouter from "../controllers/ttsController.js";
import authRouter from "./auth.js";
import progressRouter from "./progress.js";

const router = express.Router();

// Authentication routes (v1)
router.use(authRouter);

// Progress routes (v1)
router.use(progressRouter);

// Use shared route patterns for consistency
router.use(ttsRouter);
router.use(conversationRouter);
router.use(healthRouter);

export default router;
