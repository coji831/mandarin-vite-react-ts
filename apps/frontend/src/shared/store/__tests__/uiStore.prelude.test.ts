/**
 * uiStore.prelude.test.ts
 *
 * Tests for uiStore.prelude (moved from features/quiz/reducers/__tests__/uiReducer.test.ts, Story 17.1).
 */

import { uiReducer, uiInitialState } from "../uiStore.prelude";
import type { UiAction } from "../uiStore.prelude";

describe("uiReducer", () => {
  it("toggles loading", () => {
    const action: UiAction = { type: "UI/SET_LOADING", payload: { isLoading: true } };
    const res = uiReducer(uiInitialState, action);
    expect(res.isLoading).toBe(true);
  });

  it("sets lastUpdated", () => {
    const action: UiAction = { type: "UI/SET_UPDATED", payload: { when: "now" } };
    const res = uiReducer(uiInitialState, action);
    expect(res.lastUpdated).toBe("now");
  });
});
