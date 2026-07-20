/**
 * @file mnemonicService.test.ts
 * @description Tests for mnemonicService API calls
 * Story 20.2: Mnemonic Display UI
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mnemonicService } from "../mnemonicService";
import type { MnemonicResponse } from "../mnemonicService";

type AxiosResponse<T> = { data: T };

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock("shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

const SAMPLE_MNEMONIC: MnemonicResponse = {
  id: "mne_001",
  characterGlyph: "好",
  story: "A woman (女) with a child (子) is good.",
  radicalIds: ["rad_0025"],
  isEdited: false,
  isPictograph: false,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("mnemonicService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMnemonic", () => {
    it("returns data on success", async () => {
      mockGet.mockResolvedValue({ data: SAMPLE_MNEMONIC } as AxiosResponse<MnemonicResponse>);

      const result = await mnemonicService.getMnemonic("好");

      expect(result).toEqual(SAMPLE_MNEMONIC);
      expect(mockGet).toHaveBeenCalledWith("/v1/mnemonics/好");
    });

    it("returns null on 404", async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      const result = await mnemonicService.getMnemonic("好");

      expect(result).toBeNull();
    });

    it("throws on non-404 errors", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(mnemonicService.getMnemonic("好")).rejects.toThrow("Network error");
    });
  });

  describe("generateMnemonic", () => {
    it("returns response on success", async () => {
      mockPost.mockResolvedValue({ data: SAMPLE_MNEMONIC } as AxiosResponse<MnemonicResponse>);

      const result = await mnemonicService.generateMnemonic("好");

      expect(result).toEqual(SAMPLE_MNEMONIC);
      expect(mockPost).toHaveBeenCalledWith("/v1/mnemonics/好");
    });

    it("throws on error", async () => {
      mockPost.mockRejectedValue(new Error("Generation failed"));

      await expect(mnemonicService.generateMnemonic("好")).rejects.toThrow("Generation failed");
    });
  });

  describe("updateMnemonic", () => {
    it("returns response on success", async () => {
      mockPut.mockResolvedValue({ data: SAMPLE_MNEMONIC } as AxiosResponse<MnemonicResponse>);

      const result = await mnemonicService.updateMnemonic("好", "Updated story");

      expect(result).toEqual(SAMPLE_MNEMONIC);
      expect(mockPut).toHaveBeenCalledWith("/v1/mnemonics/好", { story: "Updated story" });
    });

    it("throws on error", async () => {
      mockPut.mockRejectedValue(new Error("Update failed"));

      await expect(mnemonicService.updateMnemonic("好", "story")).rejects.toThrow("Update failed");
    });
  });

  describe("deleteMnemonic", () => {
    it("returns void on success", async () => {
      mockDelete.mockResolvedValue({} as AxiosResponse<void>);

      const result = await mnemonicService.deleteMnemonic("好");

      expect(result).toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith("/v1/mnemonics/好");
    });

    it("throws on error", async () => {
      mockDelete.mockRejectedValue(new Error("Delete failed"));

      await expect(mnemonicService.deleteMnemonic("好")).rejects.toThrow("Delete failed");
    });
  });
});
