import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Ensure JWT secret is set for the middleware to verify
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

import app from "../../src/index.js";
import ExampleService from "../../src/services/exampleService.js";

describe("Examples route integration (unit)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/v1/examples/single-line returns 200 and data for valid request", async () => {
    // Mock the ExampleService to return a valid example without calling external services
    const mockResult = { chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat rice" };
    vi.spyOn(ExampleService.prototype, "generateSingleLineExample").mockResolvedValue([mockResult]);

    // Create a valid token
    const token = jwt.sign({ userId: "test-user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .post("/api/v1/examples/single-line")
      .set("Authorization", `Bearer ${token}`)
      .send({ word: "书", hskLevel: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toEqual([mockResult]);
  });

  it("GET /api/v1/examples/audio returns 200 and audio_url for valid cacheKey", async () => {
    // Mock the ExampleService to return a valid signed URL
    const mockAudioUrl = "https://signed-gcs-url/audio.mp3?...";
    vi.spyOn(ExampleService.prototype, "getOrGenerateAudio").mockResolvedValue(mockAudioUrl);

    // Create a valid token
    const token = jwt.sign({ userId: "test-user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .get("/api/v1/examples/audio")
      .set("Authorization", `Bearer ${token}`)
      .query({ cacheKey: "1bb3545b9b5810fb57f3271f34a4a0596e4b7de03314c5ed9b1c195cf0eba2a6" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("audio_url");
    expect(res.body.audio_url).toEqual(mockAudioUrl);
  });

  it("GET /api/v1/examples/audio returns 400 for missing cacheKey", async () => {
    const token = jwt.sign({ userId: "test-user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .get("/api/v1/examples/audio")
      .set("Authorization", `Bearer ${token}`)
      .query({}); // no cacheKey

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
