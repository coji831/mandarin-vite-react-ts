export type Word = {
  wordId: number;
  character?: string;
  pinyin?: string;
  meaning?: string;
  sentence?: string;
  sentencePinyin?: string;
  sentenceMeaning?: string;
};

export type VocabularyList = {
  name: string;
  description: string;
  file: string;
};
