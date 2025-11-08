import { selectWordEntity, selectAllWordEntities } from "../selectors";
import type { RootState } from "../reducers/rootReducer";

describe("selectors", () => {
  const mockState: RootState = {
    lists: {
      wordsById: {
        "1": { id: "1", word: "你好", learnedAt: null },
        "2": { id: "2", word: "谢谢", learnedAt: "2025-11-08T00:00:00Z" },
      },
      wordIds: ["1", "2"],
    },
    user: { userId: "u1", preferences: {} },
    ui: { isLoading: false },
  };

  it("selectWordEntity returns the correct entity", () => {
    expect(selectWordEntity(mockState, "1")).toEqual({ id: "1", word: "你好", learnedAt: null });
    expect(selectWordEntity(mockState, "2")).toEqual({
      id: "2",
      word: "谢谢",
      learnedAt: "2025-11-08T00:00:00Z",
    });
    expect(selectWordEntity(mockState, "3")).toBeUndefined();
  });

  it("selectAllWordEntities returns all entities in order", () => {
    expect(selectAllWordEntities(mockState)).toEqual([
      { id: "1", word: "你好", learnedAt: null },
      { id: "2", word: "谢谢", learnedAt: "2025-11-08T00:00:00Z" },
    ]);
  });
});
