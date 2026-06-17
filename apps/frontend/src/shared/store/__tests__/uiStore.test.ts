/**
 * Tests for uiStore (Zustand)
 * Story 17.5: Migrate UI reducer to Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "../uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState());
  });

  it("sets loading state", () => {
    useUiStore.getState().setLoading(true);
    expect(useUiStore.getState().isLoading).toBe(true);
    useUiStore.getState().setLoading(false);
    expect(useUiStore.getState().isLoading).toBe(false);
  });

  it("sets selected list", () => {
    useUiStore.getState().setSelectedList("list-1");
    expect(useUiStore.getState().selectedList).toBe("list-1");
    useUiStore.getState().setSelectedList(null);
    expect(useUiStore.getState().selectedList).toBeNull();
  });

  it("sets error", () => {
    useUiStore.getState().setError("Something went wrong");
    expect(useUiStore.getState().error).toBe("Something went wrong");
    useUiStore.getState().setError(undefined);
    expect(useUiStore.getState().error).toBeUndefined();
  });

  it("resets to initial state", () => {
    useUiStore.getState().setLoading(true);
    useUiStore.getState().setSelectedList("list-1");
    useUiStore.getState().reset();
    const state = useUiStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.selectedList).toBeNull();
    expect(state.selectedWords).toEqual([]);
    expect(state.error).toBeUndefined();
  });

  it("sets initialized", () => {
    useUiStore.getState().setInitialized(true);
    expect(useUiStore.getState().initialized).toBe(true);
  });
});
