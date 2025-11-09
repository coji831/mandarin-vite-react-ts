import { ProgressState } from "features/mandarin/types";
import { ProgressAction, progressInitialState, progressReducer } from "../progressReducer";

describe("listsReducer", () => {
  it("returns initial state for unknown action", () => {
    // unknown actions should be typed as any for negative test — provide a cast to never to simulate unknown
    const result = progressReducer(progressInitialState, {
      type: "UNKNOWN",
    } as unknown as ProgressAction);
    expect(result).toEqual(progressInitialState);
  });

  it("marks a word as learned only if it exists", () => {
    const state: ProgressState = {
      wordsById: { w1: { wordId: "w1", learnedAt: undefined } },
      wordIds: ["w1"],
    };
    const res = progressReducer(state, {
      type: "MARK_WORD_LEARNED",
      payload: { id: "w1", when: "t" },
    });
    expect(res.wordsById.w1.learnedAt).toBe("t");
    const res2 = progressReducer(state, {
      type: "MARK_WORD_LEARNED",
      payload: { id: "missing", when: "t" },
    });
    expect(res2).toEqual(state);
  });
});
