/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationTurns } from "./ConversationTurns";
import type { ConversationTurn } from "../types";

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

describe("ConversationTurns navigation and highlighting", () => {
  it("highlights the current turn", () => {
    render(<ConversationTurns turns={turns} currentTurn={1} />);
    const allTurns = screen.getAllByRole("listitem");
    expect(allTurns[1]).toHaveClass("current");
    expect(allTurns[0]).not.toHaveClass("current");
    expect(allTurns[2]).not.toHaveClass("current");
  });

  it("aria-current is set only on the current turn", () => {
    render(<ConversationTurns turns={turns} currentTurn={2} />);
    const allTurns = screen.getAllByRole("listitem");
    expect(allTurns[2]).toHaveAttribute("aria-current", "true");
    expect(allTurns[0]).not.toHaveAttribute("aria-current");
    expect(allTurns[1]).not.toHaveAttribute("aria-current");
  });
});
