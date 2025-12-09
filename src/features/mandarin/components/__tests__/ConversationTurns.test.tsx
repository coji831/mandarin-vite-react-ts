import { render, screen } from "@testing-library/react";
import type { ConversationTurn } from "../../types";
import { ConversationTurns } from "../ConversationTurns";

describe("ConversationTurns", () => {
  const turns: ConversationTurn[] = [
    {
      speaker: "A",
      chinese: "你好！",
      pinyin: "Nǐ hǎo!",
      english: "Hello!",
      audioUrl: "audio1.mp3",
    },
    {
      speaker: "B",
      chinese: "你好吗？",
      pinyin: "Nǐ hǎo ma?",
      english: "How are you?",
      audioUrl: "audio2.mp3",
    },
  ];

  it("renders all fields by default", () => {
    render(<ConversationTurns turns={turns} wordId="test-id" />);
    expect(screen.getByText("你好！")).toBeInTheDocument();
    expect(screen.getByText("Nǐ hǎo!")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("你好吗？")).toBeInTheDocument();
    expect(screen.getByText("Nǐ hǎo ma?")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
  });

  // Removed tests for hiding pinyin/english and navigation/highlighting as these features are no longer supported.
});

const turns: ConversationTurn[] = [
  { speaker: "A", chinese: "你好！", pinyin: "Nǐ hǎo!", english: "Hello!", audioUrl: "audio1.mp3" },
  {
    speaker: "B",
    chinese: "你好吗？",
    pinyin: "Nǐ hǎo ma?",
    english: "How are you?",
    audioUrl: "audio2.mp3",
  },
  {
    speaker: "A",
    chinese: "我很好。",
    pinyin: "Wǒ hěn hǎo.",
    english: "I'm good.",
    audioUrl: "audio3.mp3",
  },
];
