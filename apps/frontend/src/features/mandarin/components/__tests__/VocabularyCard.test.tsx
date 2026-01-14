import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { VocabularyCard } from "../VocabularyCard";

describe("VocabularyCard", () => {
  it("shows 'Not started' when progress is 0 and masteredCount is 0", () => {
    render(
      <VocabularyCard
        list={{
          id: "test-list",
          name: "Test List",
          wordCount: 10,
          description: "desc",
          difficulty: "beginner",
          tags: [],
          file: "test.csv",
        }}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText(/Not started/i)).toBeInTheDocument();
  });

  it("shows correct mastered count and percent", () => {
    render(
      <VocabularyCard
        list={{
          id: "test-list",
          name: "Test List",
          wordCount: 10,
          description: "desc",
          difficulty: "beginner",
          tags: [],
          file: "test.csv",
        }}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText(/5 \/ 10 mastered \(50%\)/i)).toBeInTheDocument();
  });

  it("shows 100% and all mastered when complete", () => {
    render(
      <VocabularyCard
        list={{
          id: "test-list",
          name: "Test List",
          wordCount: 10,
          description: "desc",
          difficulty: "beginner",
          tags: [],
          file: "test.csv",
        }}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText(/10 \/ 10 mastered \(100%\)/i)).toBeInTheDocument();
  });
});
