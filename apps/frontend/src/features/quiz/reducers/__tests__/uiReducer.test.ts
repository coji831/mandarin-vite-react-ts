import { uiReducer, uiInitialState } from "../uiReducer";
import type { UiAction } from "../uiReducer";

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
