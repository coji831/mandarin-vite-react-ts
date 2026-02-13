/**
 * AIFeedbackPanel Component Tests
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AIFeedbackPanel from "../AIFeedbackPanel";

describe("AIFeedbackPanel", () => {
  describe("Error type badges", () => {
    it("displays tone error badge with correct styling", () => {
      render(<AIFeedbackPanel explanation="You confused tone 2 with tone 3" errorType="tone" />);

      expect(screen.getByText("🔊")).toBeInTheDocument();
      expect(screen.getByText("Tone Error")).toBeInTheDocument();
    });

    it("displays character error badge with correct styling", () => {
      render(
        <AIFeedbackPanel
          explanation="The character is written incorrectly"
          errorType="character"
        />,
      );

      expect(screen.getByText("✏️")).toBeInTheDocument();
      expect(screen.getByText("Character Error")).toBeInTheDocument();
    });

    it("displays meaning error badge with correct styling", () => {
      render(<AIFeedbackPanel explanation="The meaning doesn't match" errorType="meaning" />);

      expect(screen.getByText("💡")).toBeInTheDocument();
      expect(screen.getByText("Meaning Error")).toBeInTheDocument();
    });

    it("displays generic error badge with correct styling", () => {
      render(<AIFeedbackPanel explanation="General feedback" errorType="generic" />);

      expect(screen.getByText("ℹ️")).toBeInTheDocument();
      expect(screen.getByText("Info")).toBeInTheDocument();
    });
  });

  describe("Explanation display", () => {
    it("renders explanation text correctly", () => {
      const explanation =
        "You confused tone 2 (rising) with tone 3 (falling-rising). Practice listening to both tones.";
      render(<AIFeedbackPanel explanation={explanation} errorType="tone" />);

      expect(screen.getByText(explanation)).toBeInTheDocument();
    });

    it("handles multi-line explanations", () => {
      const explanation = "First line of explanation.\nSecond line of explanation.";
      render(<AIFeedbackPanel explanation={explanation} errorType="character" />);

      expect(screen.getByText(/First line of explanation.*Second line/)).toBeInTheDocument();
    });

    it("handles long explanations", () => {
      const longExplanation =
        "This is a very long explanation that contains multiple sentences and provides detailed feedback about the error. It should wrap correctly and remain readable. The component should handle this gracefully.";
      render(<AIFeedbackPanel explanation={longExplanation} errorType="meaning" />);

      expect(screen.getByText(longExplanation)).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("shows skeleton loader when loading is true", () => {
      render(<AIFeedbackPanel explanation="" errorType="tone" loading={true} />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("feedback-skeleton");
    });

    it("has proper aria attributes for loading state", () => {
      render(<AIFeedbackPanel explanation="" errorType="tone" loading={true} />);

      const loadingElement = screen.getByRole("status", { hidden: true });
      expect(loadingElement).toHaveAttribute("aria-busy", "true");
    });

    it("does not show explanation when loading", () => {
      render(
        <AIFeedbackPanel explanation="This should not appear" errorType="tone" loading={true} />,
      );

      expect(screen.queryByText("This should not appear")).not.toBeInTheDocument();
    });

    it("does not show error badge when loading", () => {
      render(<AIFeedbackPanel explanation="" errorType="tone" loading={true} />);

      expect(screen.queryByText("Tone Error")).not.toBeInTheDocument();
    });
  });

  describe("Fallback state", () => {
    it("shows fallback message when explanation is empty and not loading", () => {
      render(<AIFeedbackPanel explanation="" errorType="generic" />);

      expect(screen.getByText(/AI feedback is currently unavailable/)).toBeInTheDocument();
    });

    it("shows info icon in fallback state", () => {
      render(<AIFeedbackPanel explanation="" errorType="generic" />);

      const fallback = screen.getByText(/AI feedback is currently unavailable/);
      expect(fallback.parentElement?.querySelector(".fallback-icon")).toBeInTheDocument();
    });

    it("does not show error badge in fallback state", () => {
      render(<AIFeedbackPanel explanation="" errorType="tone" />);

      expect(screen.queryByText("Tone Error")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper region role and label", () => {
      render(<AIFeedbackPanel explanation="Test explanation" errorType="tone" />);

      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-label", "AI Feedback");
    });

    it("error badge icon is aria-hidden", () => {
      render(<AIFeedbackPanel explanation="Test explanation" errorType="tone" />);

      const icon = screen.getByText("🔊");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Edge cases", () => {
    it("handles loading=false explicitly", () => {
      render(<AIFeedbackPanel explanation="Test" errorType="tone" loading={false} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("handles undefined loading prop (defaults to false)", () => {
      render(<AIFeedbackPanel explanation="Test" errorType="tone" />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("handles whitespace-only explanation as truthy", () => {
      render(<AIFeedbackPanel explanation="   " errorType="generic" />);

      // Whitespace is not considered empty by the component's logic (truthy string)
      // Component renders it, but Testing Library normalizes whitespace
      const feedbackText = screen.getByText((content, element) => {
        return element?.classList.contains("feedback-text") ?? false;
      });
      expect(feedbackText).toBeInTheDocument();
    });
  });
});
