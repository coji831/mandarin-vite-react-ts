/**
 * @file components/tones/__tests__/SandhiDrill.test.tsx
 * @description Component tests for SandhiDrill (Story 21.17)
 *
 * Tests the rules intro UI (static, no API needed) and sub-component behavior.
 * API-dependent tests are covered by the service unit tests instead,
 * since axios interceptors conflict with jsdom/MSW in vitest.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SandhiDrill } from "../SandhiDrill";
import * as service from "../../../services/sandhiDrillService";

const mockQuestions = [
  {
    id: "sq-001",
    characters: "你好",
    dictionaryPinyin: "nǐ hǎo",
    correctAnswer: "ní hǎo",
    ruleId: "3-3-sandhi",
    options: ["ní hǎo", "nǐ hǎo", "nǐ háo", "nì hǎo"],
  },
  {
    id: "sq-002",
    characters: "不是",
    dictionaryPinyin: "bù shì",
    correctAnswer: "bú shì",
    ruleId: "bu-before-4th",
    options: ["bú shì", "bù shì", "bù shí", "bú shí"],
  },
];

describe("SandhiDrill", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders in rules intro state by default", () => {
    render(<SandhiDrill />);

    expect(screen.getByText("Tone Sandhi Drill")).toBeInTheDocument();
    expect(screen.getByText("Third Tone Sandhi")).toBeInTheDocument();
    expect(screen.getByText("不 (bù) Before 4th Tone")).toBeInTheDocument();
    expect(screen.getByText("一 (yī) Before 4th Tone")).toBeInTheDocument();
    expect(screen.getByText("一 (yī) Before Non-4th Tone")).toBeInTheDocument();
    expect(screen.getByText("Start Drill")).toBeInTheDocument();
  });

  it("calls getSandhiDrillQuestions when Start Drill is clicked", async () => {
    const spy = vi.spyOn(service, "getSandhiDrillQuestions").mockResolvedValue(mockQuestions);
    vi.spyOn(service, "calculateScore").mockReturnValue({
      score: 2,
      total: 2,
      ruleScores: {},
    });
    vi.spyOn(service, "submitSandhiDrillAttempt").mockResolvedValue(undefined);

    render(<SandhiDrill />);

    fireEvent.click(screen.getByText("Start Drill"));

    // Wait for the service to be called
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(10);
    });
  });

  it("shows loading then active state on 'Start Drill' click", async () => {
    vi.spyOn(service, "getSandhiDrillQuestions").mockResolvedValue(mockQuestions);
    vi.spyOn(service, "calculateScore").mockReturnValue({
      score: 2,
      total: 2,
      ruleScores: {},
    });
    vi.spyOn(service, "submitSandhiDrillAttempt").mockResolvedValue(undefined);

    render(<SandhiDrill />);

    fireEvent.click(screen.getByText("Start Drill"));

    await waitFor(() => {
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });

    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("ní hǎo")).toBeInTheDocument();
  });

  it("shows correct feedback on correct answer", async () => {
    vi.spyOn(service, "getSandhiDrillQuestions").mockResolvedValue(mockQuestions);
    vi.spyOn(service, "calculateScore").mockReturnValue({
      score: 2,
      total: 2,
      ruleScores: {},
    });
    vi.spyOn(service, "submitSandhiDrillAttempt").mockResolvedValue(undefined);

    render(<SandhiDrill />);
    fireEvent.click(screen.getByText("Start Drill"));

    await vi.waitFor(() => {
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("ní hǎo"));

    await waitFor(() => {
      // Target the feedback alert specifically — the prompt "Which spoken
      // (sandhi) pinyin is correct?" also matches /correct/i, so getByText
      // would throw on multiple matches.
      expect(screen.getByRole("alert")).toHaveTextContent(/correct/i);
    });
  });

  it("shows wrong feedback on incorrect answer", async () => {
    vi.spyOn(service, "getSandhiDrillQuestions").mockResolvedValue(mockQuestions);
    vi.spyOn(service, "calculateScore").mockReturnValue({
      score: 2,
      total: 2,
      ruleScores: {},
    });
    vi.spyOn(service, "submitSandhiDrillAttempt").mockResolvedValue(undefined);

    render(<SandhiDrill />);
    fireEvent.click(screen.getByText("Start Drill"));

    await vi.waitFor(() => {
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("nǐ hǎo"));

    await waitFor(() => {
      expect(screen.getByText(/sandhi form is:/i)).toBeInTheDocument();
    });
  });

  it("completes drill and reaches results phase", async () => {
    vi.spyOn(service, "getSandhiDrillQuestions").mockResolvedValue(mockQuestions);
    vi.spyOn(service, "calculateScore").mockReturnValue({
      score: 2,
      total: 2,
      ruleScores: {},
    });
    vi.spyOn(service, "submitSandhiDrillAttempt").mockResolvedValue(undefined);

    render(<SandhiDrill />);
    fireEvent.click(screen.getByText("Start Drill"));

    await vi.waitFor(() => {
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("ní hǎo"));

    await waitFor(
      () => {
        expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    fireEvent.click(screen.getByText("bú shì"));

    await waitFor(
      () => {
        expect(screen.getByText("Drill Complete!")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Review Rules")).toBeInTheDocument();
  });
});
