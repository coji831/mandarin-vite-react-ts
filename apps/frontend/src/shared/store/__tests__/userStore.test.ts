/**
 * Tests for userStore (Zustand)
 * Story 17.5: Migrate user reducer to Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "../userStore";

describe("userStore", () => {
  beforeEach(() => {
    useUserStore.setState(useUserStore.getInitialState());
  });

  it("sets user ID", () => {
    useUserStore.getState().setUserId("user-1");
    expect(useUserStore.getState().userId).toBe("user-1");
    useUserStore.getState().setUserId(null);
    expect(useUserStore.getState().userId).toBeNull();
  });

  it("sets preferences", () => {
    useUserStore.getState().setPreferences({ theme: "dark", language: "zh" });
    const prefs = useUserStore.getState().preferences;
    expect(prefs?.theme).toBe("dark");
    expect(prefs?.language).toBe("zh");
  });

  it("resets to initial state", () => {
    useUserStore.getState().setUserId("user-1");
    useUserStore.getState().setPreferences({ theme: "dark" });
    useUserStore.getState().reset();
    const state = useUserStore.getState();
    expect(state.userId).toBeNull();
    expect(state.preferences).toBeNull();
  });

  it("refresh reads from localStorage", () => {
    localStorage.setItem("deviceUserId", "local-user");
    useUserStore.getState().refresh();
    expect(useUserStore.getState().userId).toBe("local-user");
    localStorage.removeItem("deviceUserId");
  });
});
