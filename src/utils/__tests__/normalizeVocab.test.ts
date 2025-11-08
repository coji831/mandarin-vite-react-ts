import { normalizeVocab } from "../normalizeVocab";
import { WordList } from "../../types/word";
import { VocabWord } from "../csvLoader";

describe("normalizeVocab", () => {
  it("should normalize raw vocab array to WordList", () => {
    const raw = [
      { wordId: "1", Chinese: "你好", Pinyin: "nǐ hǎo", English: "hello" },
      { wordId: "2", Chinese: "谢谢", Pinyin: "xièxie", English: "thank you" },
    ];
    const result: WordList = normalizeVocab(raw);
    expect(result.itemIds).toEqual(["1", "2"]);
    expect(result.itemsById["1"]).toEqual({
      wordId: "1",
      chinese: "你好",
      pinyin: "nǐ hǎo",
      english: "hello",
    });
    expect(result.itemsById["2"]).toEqual({
      wordId: "2",
      chinese: "谢谢",
      pinyin: "xièxie",
      english: "thank you",
    });
  });

  it("should skip rows without wordId", () => {
    const raw = [
      { Chinese: "再见", Pinyin: "zàijiàn", English: "goodbye" },
      { wordId: "3", Chinese: "请", Pinyin: "qǐng", English: "please" },
    ];
    const result: WordList = normalizeVocab(raw as VocabWord[]);
    expect(result.itemIds).toEqual(["3"]);
    expect(result.itemsById["3"]).toEqual({
      wordId: "3",
      chinese: "请",
      pinyin: "qǐng",
      english: "please",
    });
  });
});
