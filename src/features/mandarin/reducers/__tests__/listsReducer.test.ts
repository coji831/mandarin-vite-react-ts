import { listsReducer, listsInitialState, ListsAction } from "../listsReducer";
import type { ProgressState } from "../../types/ProgressNormalized";

describe("listsReducer", () => {
  it("returns initial state for unknown action", () => {
    // unknown actions should be typed as any for negative test — provide a cast to never to simulate unknown
    const result = listsReducer(listsInitialState, { type: "UNKNOWN" } as unknown as ListsAction);
    expect(result).toEqual(listsInitialState);
  });

  it("marks a word as learned only if it exists", () => {
    const state: ProgressState = {
      wordsById: { w1: { id: "w1", word: "一", learnedAt: undefined } },
      wordIds: ["w1"],
    };
    const res = listsReducer(state, {
      type: "MARK_WORD_LEARNED",
      payload: { id: "w1", when: "t" },
    });
    expect(res.wordsById.w1.learnedAt).toBe("t");
    const res2 = listsReducer(state, {
      type: "MARK_WORD_LEARNED",
      payload: { id: "missing", when: "t" },
    });
    expect(res2).toEqual(state);
  });
});
