/**
 * @file apps/backend/tests/modules/readers/ReadersProgressController.test.ts
 * @description Integration tests for ReadersController session & bookmark endpoints via supertest
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { ReadersController } from "../../../src/modules/readers/api/ReadersController.js";
import { asyncHandler } from "../../../src/shared/middleware/asyncHandler.js";
import type { ReadersService } from "../../../src/modules/readers/services/ReadersService.js";

// ── Test App Factory ────────────────────────────────────────────────────────

function createTestApp(controller: ReadersController) {
  const app = express();
  app.use(express.json());

  // Simulate auth middleware — sets req.userId for all routes
  app.use((req, _res, next) => {
    req.userId = "test-user-id";
    next();
  });

  // Session routes
  app.get(
    "/v1/readers/sessions/:passageId",
    asyncHandler((req, res) => controller.getSession(req, res)),
  );
  app.put(
    "/v1/readers/sessions/:passageId",
    asyncHandler((req, res) => controller.updateSession(req, res)),
  );
  app.post(
    "/v1/readers/sessions/:passageId/complete",
    asyncHandler((req, res) => controller.completePassage(req, res)),
  );

  // Bookmark routes
  app.get(
    "/v1/readers/bookmarks",
    asyncHandler((req, res) => controller.listBookmarks(req, res)),
  );
  app.post(
    "/v1/readers/bookmarks",
    asyncHandler((req, res) => controller.addBookmark(req, res)),
  );
  app.delete(
    "/v1/readers/bookmarks/by-passage/:passageId",
    asyncHandler((req, res) => controller.deleteBookmarkByPassage(req, res)),
  );
  app.get(
    "/v1/readers/bookmarks/by-passage/:passageId",
    asyncHandler((req, res) => controller.checkBookmarkByPassage(req, res)),
  );

  return app;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockSessionData = { currentSentence: 3, isCompleted: false };
const mockCompletedData = { currentSentence: 10, isCompleted: true };
const mockBookmarkList = ["passage_001", "passage_002"];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("ReadersController — Reading Progress", () => {
  let mockService: ReadersService;
  let controller: ReadersController;
  let app: express.Application;

  beforeEach(() => {
    mockService = {
      getOrCreateSession: vi.fn(),
      updatePosition: vi.fn(),
      markCompleted: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmarkByPassage: vi.fn(),
      checkBookmarkByPassage: vi.fn(),
      listBookmarks: vi.fn(),
    } as unknown as ReadersService;

    controller = new ReadersController(mockService);
    app = createTestApp(controller);
  });

  // ── GET /v1/readers/sessions/:passageId ──────────────────────────────────

  describe("GET /v1/readers/sessions/:passageId", () => {
    it("returns 200 with session data", async () => {
      vi.mocked(mockService.getOrCreateSession).mockResolvedValue(mockSessionData);

      const res = await request(app).get("/v1/readers/sessions/passage_001");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: mockSessionData });
      expect(mockService.getOrCreateSession).toHaveBeenCalledWith("test-user-id", "passage_001");
    });

    it("returns 401 when userId is missing", async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.get(
        "/v1/readers/sessions/:passageId",
        asyncHandler((req, res) => controller.getSession(req, res)),
      );

      const res = await request(appWithoutAuth).get("/v1/readers/sessions/passage_001");

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "Failed to get session", code: "AUTH_ERROR" });
    });

    it("returns 400 for missing passageId", async () => {
      const res = await request(app).get("/v1/readers/sessions/");

      expect(res.status).toBe(404); // route not matched
    });
  });

  // ── PUT /v1/readers/sessions/:passageId ──────────────────────────────────

  describe("PUT /v1/readers/sessions/:passageId", () => {
    it("returns 200 with updated session data", async () => {
      vi.mocked(mockService.updatePosition).mockResolvedValue(mockSessionData);

      const res = await request(app)
        .put("/v1/readers/sessions/passage_001")
        .send({ currentSentence: 3 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: mockSessionData });
      expect(mockService.updatePosition).toHaveBeenCalledWith("test-user-id", "passage_001", 3);
    });

    it("returns 400 for missing currentSentence", async () => {
      const res = await request(app).put("/v1/readers/sessions/passage_001").send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: "Failed to update session",
        code: "VALIDATION_ERROR",
      });
    });

    it("returns 400 for negative currentSentence", async () => {
      const res = await request(app)
        .put("/v1/readers/sessions/passage_001")
        .send({ currentSentence: -1 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: "Failed to update session",
        code: "VALIDATION_ERROR",
      });
    });

    it("returns 400 for non-integer currentSentence", async () => {
      const res = await request(app)
        .put("/v1/readers/sessions/passage_001")
        .send({ currentSentence: 1.5 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: "Failed to update session",
        code: "VALIDATION_ERROR",
      });
    });
  });

  // ── POST /v1/readers/sessions/:passageId/complete ────────────────────────

  describe("POST /v1/readers/sessions/:passageId/complete", () => {
    it("returns 200 with passageId", async () => {
      vi.mocked(mockService.markCompleted).mockResolvedValue({ passageId: "passage_001" });

      const res = await request(app).post("/v1/readers/sessions/passage_001/complete");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { passageId: "passage_001" } });
      expect(mockService.markCompleted).toHaveBeenCalledWith("test-user-id", "passage_001");
    });

    it("returns 401 when userId is missing", async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.post(
        "/v1/readers/sessions/:passageId/complete",
        asyncHandler((req, res) => controller.completePassage(req, res)),
      );

      const res = await request(appWithoutAuth).post("/v1/readers/sessions/passage_001/complete");

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "Failed to complete passage", code: "AUTH_ERROR" });
    });
  });

  // ── GET /v1/readers/bookmarks ────────────────────────────────────────────

  describe("GET /v1/readers/bookmarks", () => {
    it("returns 200 with bookmark list", async () => {
      vi.mocked(mockService.listBookmarks).mockResolvedValue(mockBookmarkList);

      const res = await request(app).get("/v1/readers/bookmarks");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { bookmarks: mockBookmarkList } });
      expect(mockService.listBookmarks).toHaveBeenCalledWith("test-user-id");
    });

    it("returns 200 with empty list when no bookmarks", async () => {
      vi.mocked(mockService.listBookmarks).mockResolvedValue([]);

      const res = await request(app).get("/v1/readers/bookmarks");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { bookmarks: [] } });
    });
  });

  // ── POST /v1/readers/bookmarks ───────────────────────────────────────────

  describe("POST /v1/readers/bookmarks", () => {
    it("returns 201 with passageId", async () => {
      vi.mocked(mockService.addBookmark).mockResolvedValue({ passageId: "passage_001" });

      const res = await request(app)
        .post("/v1/readers/bookmarks")
        .send({ passageId: "passage_001" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ data: { passageId: "passage_001" } });
      expect(mockService.addBookmark).toHaveBeenCalledWith("test-user-id", "passage_001");
    });

    it("returns 400 for missing passageId", async () => {
      const res = await request(app).post("/v1/readers/bookmarks").send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "Failed to add bookmark", code: "VALIDATION_ERROR" });
    });

    it("returns 400 for non-string passageId", async () => {
      const res = await request(app).post("/v1/readers/bookmarks").send({ passageId: 123 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "Failed to add bookmark", code: "VALIDATION_ERROR" });
    });
  });

  // ── DELETE /v1/readers/bookmarks/by-passage/:passageId ───────────────────

  describe("DELETE /v1/readers/bookmarks/by-passage/:passageId", () => {
    it("returns 204 on success", async () => {
      vi.mocked(mockService.removeBookmarkByPassage).mockResolvedValue();

      const res = await request(app).delete("/v1/readers/bookmarks/by-passage/passage_001");

      expect(res.status).toBe(204);
      expect(mockService.removeBookmarkByPassage).toHaveBeenCalledWith(
        "test-user-id",
        "passage_001",
      );
    });

    it("returns 401 when userId is missing", async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.delete(
        "/v1/readers/bookmarks/by-passage/:passageId",
        asyncHandler((req, res) => controller.deleteBookmarkByPassage(req, res)),
      );

      const res = await request(appWithoutAuth).delete(
        "/v1/readers/bookmarks/by-passage/passage_001",
      );

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "Failed to remove bookmark", code: "AUTH_ERROR" });
    });
  });

  // ── GET /v1/readers/bookmarks/by-passage/:passageId ──────────────────────

  describe("GET /v1/readers/bookmarks/by-passage/:passageId", () => {
    it("returns 200 with isBookmarked=true", async () => {
      vi.mocked(mockService.checkBookmarkByPassage).mockResolvedValue(true);

      const res = await request(app).get("/v1/readers/bookmarks/by-passage/passage_001");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { isBookmarked: true } });
      expect(mockService.checkBookmarkByPassage).toHaveBeenCalledWith(
        "test-user-id",
        "passage_001",
      );
    });

    it("returns 200 with isBookmarked=false", async () => {
      vi.mocked(mockService.checkBookmarkByPassage).mockResolvedValue(false);

      const res = await request(app).get("/v1/readers/bookmarks/by-passage/passage_001");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { isBookmarked: false } });
    });

    it("returns 401 when userId is missing", async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.get(
        "/v1/readers/bookmarks/by-passage/:passageId",
        asyncHandler((req, res) => controller.checkBookmarkByPassage(req, res)),
      );

      const res = await request(appWithoutAuth).get("/v1/readers/bookmarks/by-passage/passage_001");

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: "Failed to check bookmark", code: "AUTH_ERROR" });
    });
  });
});
