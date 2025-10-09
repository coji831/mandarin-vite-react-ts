import type { VocabWord } from "utils";
import type { Word } from "../types";

export function transformVocabWord(w: VocabWord): Word {
  return {
    wordId: w.wordId,
    character: w.Chinese,
    pinyin: w.Pinyin || "",
    meaning: w.English || "",
    sentence: "", // No sentence in VocabWord, set empty or add logic if available
    sentencePinyin: "",
    sentenceMeaning: "",
  };
}
