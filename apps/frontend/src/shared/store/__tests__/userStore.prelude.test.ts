/**
 * userStore.prelude.test.ts
 *
 * Tests for userStore.prelude (moved from features/quiz/reducers/__tests__/userReducer.test.ts, Story 17.1).
 */

import { userReducer, userInitialState } from "../userStore.prelude";
import type { UserAction } from "../userStore.prelude";

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
