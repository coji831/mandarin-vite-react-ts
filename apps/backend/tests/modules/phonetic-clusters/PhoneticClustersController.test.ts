/**
 * @file apps/backend/tests/modules/phonetic-clusters/PhoneticClustersController.test.ts
 * @description Integration tests for PhoneticClustersController via supertest
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { PhoneticClustersController } from "../../../src/modules/phonetic-clusters/api/PhoneticClustersController.js";
import { PhoneticClusterNotFoundError } from "../../../src/modules/phonetic-clusters/types/phonetic-clusters-errors.js";
import { asyncHandler } from "../../../src/shared/middleware/asyncHandler.js";
import type { PhoneticClustersService } from "../../../src/modules/phonetic-clusters/services/PhoneticClustersService.js";

// ── Test App Factory ────────────────────────────────────────────────────────

function createTestApp(controller: PhoneticClustersController) {
  const app = express();
  app.use(express.json());

  // Inject controller via middleware (mirrors production)
  app.use((req, _res, next) => {
    req.phoneticClustersController = controller;
    next();
  });

  // GET /v1/phonetic-clusters
  app.get(
    "/v1/phonetic-clusters",
    asyncHandler((req, res) => req.phoneticClustersController!.list(req, res)),
  );

  // GET /v1/phonetic-clusters/:id
  app.get(
    "/v1/phonetic-clusters/:id",
    asyncHandler((req, res) => req.phoneticClustersController!.getById(req, res)),
  );

  return app;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockClusterList = [
  {
    id: "pc_0001",
    phoneticPattern: "巴",
    pinyin: "bǎ",
    description: "A phonetic series with b- initial",
    pronunciationNote: null,
    memberCount: 1,
    hskLevels: [3],
    members: [{ glyph: "把", pinyin: "bǎ", meaning: "to hold, to grasp", hskLevel: 3 }],
  },
];

const mockClusterDetail = {
  id: "pc_0001",
  phoneticPattern: "巴",
  pinyin: "bǎ",
  description: "A phonetic series with b- initial",
  pronunciationNote: null,
  memberCount: 1,
  hskLevels: [3],
  members: [{ glyph: "把", pinyin: "bǎ", meaning: "to hold, to grasp", hskLevel: 3 }],
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("PhoneticClustersController", () => {
  let mockService: PhoneticClustersService;
  let controller: PhoneticClustersController;
  let app: express.Application;

  beforeEach(() => {
    mockService = {
      listClusters: vi.fn(),
      getCluster: vi.fn(),
    } as unknown as PhoneticClustersService;

    controller = new PhoneticClustersController(mockService);
    app = createTestApp(controller);
  });

  describe("GET /v1/phonetic-clusters", () => {
    it("returns 200 with all clusters", async () => {
      vi.mocked(mockService.listClusters).mockResolvedValue(mockClusterList);

      const res = await request(app).get("/v1/phonetic-clusters");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: mockClusterList });
    });

    it("returns 200 with hskLevel filter", async () => {
      vi.mocked(mockService.listClusters).mockResolvedValue(mockClusterList);

      const res = await request(app).get("/v1/phonetic-clusters?hskLevel=1");

      expect(res.status).toBe(200);
      expect(mockService.listClusters).toHaveBeenCalledWith(1);
    });

    it("returns 400 for invalid hskLevel", async () => {
      const res = await request(app).get("/v1/phonetic-clusters?hskLevel=abc");

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: "Failed to load phonetic clusters",
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("GET /v1/phonetic-clusters/:id", () => {
    it("returns 200 with cluster detail", async () => {
      vi.mocked(mockService.getCluster).mockResolvedValue(mockClusterDetail);

      const res = await request(app).get("/v1/phonetic-clusters/pc_0001");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: mockClusterDetail });
    });

    it("returns 400 for invalid ID format", async () => {
      const res = await request(app).get("/v1/phonetic-clusters/invalid-id");

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: "Failed to load phonetic cluster",
        code: "VALIDATION_ERROR",
      });
    });

    it("returns 404 for nonexistent cluster", async () => {
      vi.mocked(mockService.getCluster).mockRejectedValue(
        new PhoneticClusterNotFoundError("pc_9999"),
      );

      const res = await request(app).get("/v1/phonetic-clusters/pc_9999");

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        error: "Failed to load phonetic cluster",
        code: "NOT_FOUND",
      });
    });
  });
});
