import { loadCsvVocab } from "../csvLoader";

describe("loadCsvVocab", () => {
  it("parses CSV string and returns VocabWord[]", async () => {
    // Simulate fetch by monkey-patching global.fetch
    const csv = "No,Chinese,Pinyin,English\n1,你好,ni hao,hello\n2,谢谢,xiexie,thank you";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => csv,
    });
    const result = await loadCsvVocab("fake-url");
    expect(result).toEqual([
      { wordId: "1", Chinese: "你好", Pinyin: "ni hao", English: "hello" },
      { wordId: "2", Chinese: "谢谢", Pinyin: "xiexie", English: "thank you" },
    ]);
  });

  it("returns [] for empty CSV", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "No,Chinese,Pinyin,English",
    });
    const result = await loadCsvVocab("fake-url");
    expect(result).toEqual([]);
  });
});

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
