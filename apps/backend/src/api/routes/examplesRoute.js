import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import ExampleService from "../../services/exampleService.js";

const router = express.Router();

const exampleService = new ExampleService();

// POST /v1/examples/single-line
router.post(
  "/v1/examples/single-line",
  asyncHandler(
    async (req, res) => {
      const payload = req.body;
      const result = await exampleService.generateSingleLineExample(payload);
      res.status(200).json({ data: result });
    },
    {
      logPrefix: "ExamplesRoute",
      validateSchema: (body) => ({
        valid: !!body && typeof body.word === "string" && Number.isInteger(Number(body.hskLevel)),
        error: "Missing required fields: word or hskLevel",
      }),
    },
  ),
);

export default router;
