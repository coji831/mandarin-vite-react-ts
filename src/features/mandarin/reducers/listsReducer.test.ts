import { listsReducer, listsInitialState } from "./listsReducer";

describe("listsReducer", () => {
  it("returns initial state for unknown action", () => {
    const result = listsReducer(listsInitialState, { type: "UNKNOWN" } as any);
    expect(result).toEqual(listsInitialState);
  });

  it("marks a word as learned only if it exists", () => {
    const state = {
      wordsById: { w1: { id: "w1", word: "一", learnedAt: undefined } },
      wordIds: ["w1"],
    };
    const res = listsReducer(
      state as any,
      { type: "MARK_WORD_LEARNED", payload: { id: "w1", when: "t" } } as any
    );
    expect(res.wordsById.w1.learnedAt).toBe("t");
    const res2 = listsReducer(
      state as any,
      { type: "MARK_WORD_LEARNED", payload: { id: "missing", when: "t" } } as any
    );
    expect(res2).toEqual(state);
  });
});
