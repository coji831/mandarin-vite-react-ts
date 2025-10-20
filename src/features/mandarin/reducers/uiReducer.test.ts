import { uiReducer, uiInitialState } from "./uiReducer";

describe("uiReducer", () => {
  it("toggles loading", () => {
    const res = uiReducer(uiInitialState, {
      type: "UI/SET_LOADING",
      payload: { isLoading: true },
    } as any);
    expect(res.isLoading).toBe(true);
  });

  it("sets lastUpdated", () => {
    const res = uiReducer(uiInitialState, {
      type: "UI/SET_UPDATED",
      payload: { when: "now" },
    } as any);
    expect(res.lastUpdated).toBe("now");
  });
});
