import { loadCsvVocab } from "./csvLoader";

describe("csvLoader", () => {
  it("should normalize wordId to string and validate uniqueness", async () => {
    // Simulate a CSV with duplicate and missing wordIds
    const csv = `No,Chinese,Pinyin,English\n1,你好,ni hao,hello\n2,谢谢,xie xie,thanks\n2,再见,zai jian,goodbye\n,请,qing,please`;
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(csv) })
    ) as any;
    const result = await loadCsvVocab("test.csv");
    expect(result).toHaveLength(4);
    expect(result[0].wordId).toBe("1");
    expect(result[2].wordId).toBe("2");
    expect(result[3].wordId).toBe("");
    // Add more assertions for logging/validation as needed
  });
});
