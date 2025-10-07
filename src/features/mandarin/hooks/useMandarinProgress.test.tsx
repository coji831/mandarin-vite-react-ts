import { render, act } from "@testing-library/react";
import React, { useRef } from "react";
import { useMandarinProgress } from "./useMandarinProgress";

// Mock window.location to avoid navigation errors in tests
Object.defineProperty(window, "location", {
  value: { href: "" },
  writable: true,
});

// Mock fetch for vocabulary data
global.fetch = jest.fn();

function TestHook({ callback }: { callback: (hook: any) => void }) {
  const hook = useMandarinProgress();
  const called = useRef(false);
  if (!called.current) {
    callback(hook);
    called.current = true;
  }
  return null;
}

describe("useMandarinProgress (list-focused API)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with default state", () => {
    let hookState: any;
    render(
      <TestHook
        callback={(hook) => {
          hookState = hook;
        }}
      />
    );
    expect(hookState.selectedList).toBeNull();
    expect(hookState.selectedWords).toEqual([]);
    expect(hookState.sections).toEqual([]);
  });

  it("should select a vocabulary list and set words", () => {
    let hookState: any;
    render(
      <TestHook
        callback={(hook) => {
          hookState = hook;
        }}
      />
    );
    act(() => {
      hookState.selectVocabularyList("HSK1", [
        { wordId: "1", character: "你", pinyin: "nǐ", meaning: "you" },
        { wordId: "2", character: "好", pinyin: "hǎo", meaning: "good" },
      ]);
    });
    expect(hookState.selectedList).toBe("HSK1");
    expect(hookState.selectedWords.length).toBe(2);
  });

  it("should expose list-focused API functions", () => {
    let hookState: any;
    render(
      <TestHook
        callback={(hook) => {
          hookState = hook;
        }}
      />
    );
    expect(typeof hookState.selectVocabularyList).toBe("function");
    expect(typeof hookState.markWordLearned).toBe("function");
    // Deprecated section-based APIs should not exist
    expect(hookState.selectedSectionId).toBeUndefined();
    expect(hookState.setSelectedSectionId).toBeUndefined();
  });
});
