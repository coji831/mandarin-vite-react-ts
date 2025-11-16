/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationTurns } from "./ConversationTurns";
import type { ConversationTurn } from "../types";

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
    render(<ConversationTurns turns={turns} />);
    expect(screen.getByText("你好！")).toBeInTheDocument();
    expect(screen.getByText("Nǐ hǎo!")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("你好吗？")).toBeInTheDocument();
    expect(screen.getByText("Nǐ hǎo ma?")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
  });

  it("hides pinyin when showPinyin is false", () => {
    render(<ConversationTurns turns={turns} showPinyin={false} />);
    expect(screen.queryByText("Nǐ hǎo!")).toBeNull();
    expect(screen.queryByText("Nǐ hǎo ma?")).toBeNull();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("hides english when showEnglish is false", () => {
    render(<ConversationTurns turns={turns} showEnglish={false} />);
    expect(screen.queryByText("Hello!")).toBeNull();
    expect(screen.queryByText("How are you?")).toBeNull();
    expect(screen.getByText("Nǐ hǎo!"));
  });
});
