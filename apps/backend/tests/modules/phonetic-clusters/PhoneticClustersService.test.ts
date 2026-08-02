/**
 * @file apps/backend/tests/modules/phonetic-clusters/PhoneticClustersService.test.ts
 * @description Unit tests for PhoneticClustersService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PhoneticClustersService } from "../../../src/modules/phonetic-clusters/services/PhoneticClustersService.js";
import { PhoneticClusterNotFoundError } from "../../../src/modules/phonetic-clusters/types/phonetic-clusters-errors.js";
import type { PhoneticClustersRepository } from "../../../src/modules/phonetic-clusters/repositories/PhoneticClustersRepository.js";
import type { PhoneticClusterWithMembers } from "../../../src/modules/phonetic-clusters/types/phonetic-clusters.js";

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockMember = {
  character: {
    glyph: "把",
    definition: "to hold, to grasp",
    readings: [{ pinyin: "bǎ" }],
    hskLevel: 3,
    hskLevels: [{ hskLevel: 3 }],
  },
  sequenceOrder: 1,
};

function buildMockCluster(
  overrides: Partial<PhoneticClusterWithMembers> = {},
): PhoneticClusterWithMembers {
  return {
    id: "pc_0001",
    componentId: "comp_001",
    displayOrder: 1,
    description: "A phonetic series with b- initial",
    pronunciationNote: null,
    phoneticPinyin: "bǎ",
    component: {
      glyph: "巴",
      meaning: "to wish for",
    },
    members: [mockMember],
    ...overrides,
  } as PhoneticClusterWithMembers;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("PhoneticClustersService", () => {
  let mockRepository: PhoneticClustersRepository;
  let service: PhoneticClustersService;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
    } as unknown as PhoneticClustersRepository;

    service = new PhoneticClustersService(mockRepository);
  });

  describe("listClusters", () => {
    it("returns all clusters when no filter is provided", async () => {
      const mockClusters = [
        buildMockCluster(),
        buildMockCluster({ id: "pc_0002", phoneticPinyin: "pā" }),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(mockClusters);

      const result = await service.listClusters();

      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "pc_0001",
        phoneticPattern: "巴",
        pinyin: "bǎ",
        description: "A phonetic series with b- initial",
        memberCount: 1,
      });
      expect(result[0].members[0]).toMatchObject({
        glyph: "把",
        pinyin: "bǎ",
        meaning: "to hold, to grasp",
        hskLevel: 3,
      });
    });

    it("passes hskLevel filter to repository", async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      await service.listClusters(1);

      expect(mockRepository.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe("getCluster", () => {
    it("returns cluster with members for a valid ID", async () => {
      const mockCluster = buildMockCluster();
      vi.mocked(mockRepository.findById).mockResolvedValue(mockCluster);

      const result = await service.getCluster("pc_0001");

      expect(mockRepository.findById).toHaveBeenCalledWith("pc_0001");
      expect(result).toMatchObject({
        id: "pc_0001",
        phoneticPattern: "巴",
        pinyin: "bǎ",
      });
    });

    it("throws PhoneticClusterNotFoundError for nonexistent ID", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getCluster("nonexistent")).rejects.toThrow(PhoneticClusterNotFoundError);
      await expect(service.getCluster("nonexistent")).rejects.toThrow(
        "No phonetic cluster found for id: nonexistent",
      );
    });
  });
});
