/**
 * @file hooks/__tests__/useGeneratePassage.test.ts
 * @description Tests for useGeneratePassage hook
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGeneratePassage } from "../useGeneratePassage";

const mockGeneratePassage = vi.fn();

vi.mock("../../services/passageService", () => ({
  generatePassage: (...args: unknown[]) => mockGeneratePassage(...args),
}));

describe("useGeneratePassage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with default state", () => {
    const { result } = renderHook(() => useGeneratePassage());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generatedId).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it("sets isGenerating during generation", async () => {
    mockGeneratePassage.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useGeneratePassage());

    act(() => {
      result.current.generate();
    });

    expect(result.current.isGenerating).toBe(true);
  });

  it("sets generatedId on success", async () => {
    mockGeneratePassage.mockResolvedValue({ id: "new-passage-id" });

    const { result } = renderHook(() => useGeneratePassage());

    act(() => {
      result.current.generate();
    });

    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    expect(result.current.generatedId).toBe("new-passage-id");
    expect(result.current.hasError).toBe(false);
  });

  it("passes HSK level to service", async () => {
    mockGeneratePassage.mockResolvedValue({ id: "new-passage-id" });

    const { result } = renderHook(() => useGeneratePassage());

    await act(async () => {
      await result.current.generate(3);
    });

    expect(mockGeneratePassage).toHaveBeenCalledWith(3);
  });

  it("sets hasError on failure", async () => {
    mockGeneratePassage.mockRejectedValue(new Error("Generation failed"));

    const { result } = renderHook(() => useGeneratePassage());

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.generatedId).toBeNull();
  });

  it("resets state on reset", async () => {
    mockGeneratePassage.mockResolvedValue({ id: "new-passage-id" });

    const { result } = renderHook(() => useGeneratePassage());

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.generatedId).toBe("new-passage-id");

    act(() => {
      result.current.reset();
    });

    expect(result.current.generatedId).toBeNull();
    expect(result.current.hasError).toBe(false);
  });
});
