/**
 * @file pages/practices/__tests__/QuizPage.test.tsx
 * @description Tests for QuizPage — the `?type=` query param is validated
 * against the strategy registry (via `getStrategy` through
 * `useSearchParamState`): a registered type renders the quiz session, an
 * unregistered/bogus type renders the fallback CTA.
 * Story 22.4 follow-up (Review N1).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuizPage } from "../QuizPage";

// Render a marker for the session so the test only exercises QuizPage's routing
// decision — QuizSessionPage's engine/store behavior is covered by its own test.
vi.mock("../QuizSessionPage", () => ({
  QuizSessionPage: ({ strategyType }: { strategyType: string }) => (
    <div data-testid="quiz-session">session:{strategyType}</div>
  ),
}));

function renderQuizPage(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <QuizPage />
    </MemoryRouter>,
  );
}

describe("QuizPage", () => {
  it("renders the quiz session when ?type= matches a registered strategy", () => {
    renderQuizPage("/practices/quiz?type=ime-simulator");
    expect(screen.getByTestId("quiz-session")).toHaveTextContent("session:ime-simulator");
  });

  it("renders the fallback CTA when ?type= is not a registered strategy", () => {
    renderQuizPage("/practices/quiz?type=bogus");
    expect(screen.getByRole("heading", { name: /Quiz/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Practices" })).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-session")).not.toBeInTheDocument();
  });

  it("renders the fallback CTA when ?type= is absent", () => {
    renderQuizPage("/practices/quiz");
    expect(screen.getByRole("heading", { name: /Quiz/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Practices" })).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-session")).not.toBeInTheDocument();
  });
});
