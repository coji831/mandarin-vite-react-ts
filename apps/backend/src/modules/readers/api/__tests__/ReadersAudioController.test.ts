/**
 * @file modules/readers/api/__tests__/ReadersAudioController.test.ts
 * @description Unit tests for ReadersController.getPassageAudio
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { ReadersController } from "../ReadersController.js";
import { PassageNotFoundError } from "../../types/readers-errors.js";

describe("ReadersController — getPassageAudio", () => {
  let controller: ReadersController;
  let mockReadersService: any;
  let mockReq: any;
  let mockRes: any;

  const mockPassageAudioResponse = {
    audioUrls: {
      0: { url: "https://storage.googleapis.com/bucket/tts/hash/0.mp3", source: "gcs" },
      1: { url: "https://storage.googleapis.com/bucket/tts/hash/1.mp3", source: "ondemand" },
    },
  };

  beforeEach(() => {
    mockReadersService = {
      getPassageAudio: vi.fn(),
    };

    controller = new ReadersController(mockReadersService);

    mockReq = {
      params: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("should return 200 with audio URLs for a valid passage", async () => {
    mockReq.params = { id: "passage-1" };
    mockReadersService.getPassageAudio.mockResolvedValue(mockPassageAudioResponse);

    await controller.getPassageAudio(mockReq, mockRes);

    expect(mockReadersService.getPassageAudio).toHaveBeenCalledWith("passage-1");
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockPassageAudioResponse });
  });

  it("should return 400 when :id param is missing", async () => {
    mockReq.params = { id: "" };

    await controller.getPassageAudio(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Failed to get passage audio",
      code: "VALIDATION_ERROR",
    });
  });

  it("should return 404 when passage does not exist", async () => {
    mockReq.params = { id: "nonexistent" };
    mockReadersService.getPassageAudio.mockRejectedValue(new PassageNotFoundError("nonexistent"));

    await controller.getPassageAudio(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Failed to get passage audio",
      code: "NOT_FOUND",
    });
  });

  it("should return 500 on data loading failure", async () => {
    mockReq.params = { id: "passage-1" };
    mockReadersService.getPassageAudio.mockRejectedValue(new Error("Database connection failed"));

    await controller.getPassageAudio(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Failed to get passage audio",
      code: "LOAD_ERROR",
    });
  });
});
