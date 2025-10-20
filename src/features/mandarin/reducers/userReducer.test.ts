import { userReducer, userInitialState } from "./userReducer";

describe("userReducer", () => {
  it("sets user id", () => {
    const res = userReducer(userInitialState, {
      type: "USER/SET_ID",
      payload: { userId: "u1" },
    } as any);
    expect(res.userId).toBe("u1");
  });

  it("sets preferences", () => {
    const res = userReducer(userInitialState, {
      type: "USER/SET_PREF",
      payload: { key: "theme", value: "dark" },
    } as any);
    expect(res.preferences?.theme).toBe("dark");
  });
});
