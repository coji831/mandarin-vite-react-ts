import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Ensure required env vars are set before app import validates config
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "test-bucket";
process.env.GOOGLE_TTS_CREDENTIALS_RAW =
  process.env.GOOGLE_TTS_CREDENTIALS_RAW || '{"client_email":"test@example.com"}';
process.env.GEMINI_API_CREDENTIALS_RAW =
  process.env.GEMINI_API_CREDENTIALS_RAW || '{"client_email":"test@example.com"}';

import app from "../../../index.js";
import { exampleController } from "../../../container.js";

describe("Examples route integration (unit)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/v1/examples/single-line returns 200 and data for valid request", async () => {
    // Mock the controller method to keep this test focused on route wiring/auth behavior
    const mockResult = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat rice" };
    vi.spyOn(exampleController, "generateSingleLine").mockImplementation(async (req, res) => {
      return res.status(200).json({ data: [mockResult] });
    });

    // Create a valid token
    const token = jwt.sign({ userId: "test-user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .post("/api/v1/examples/single-line")
      .set("Authorization", `Bearer ${token}`)
      .send({ word: "书", hskLevel: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });
});
