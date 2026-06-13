import { userReducer, userInitialState } from "../userReducer";
import type { UserAction } from "../userReducer";

describe("userReducer", () => {
  it("sets user id", () => {
    const action: UserAction = {
      type: "USER/SET_ID",
      payload: { userId: "u1" },
    };

    const res = userReducer(userInitialState, action);
    expect(res.userId).toBe("u1");
  });

  it("sets preferences", () => {
    const action: UserAction = {
      type: "USER/SET_PREF",
      payload: { key: "theme", value: "dark" },
    };

    const res = userReducer(userInitialState, action);
    expect(res.preferences?.theme).toBe("dark");
  });
});
