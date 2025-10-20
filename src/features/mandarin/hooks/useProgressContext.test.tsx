import { render, act, waitFor } from "@testing-library/react";
import React, { useRef } from "react";
import { useProgressData } from "./useProgressContext";

// Mock fetch for vocabulary data
global.fetch = jest.fn();

function TestHook({ callback }: { callback: (hook: any) => void }) {
  const hook = useProgressData();
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
  });

  it.skip("should select a vocabulary list and set words", async () => {
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
    await waitFor(() => {
      expect(hookState.selectedList).toBe("HSK1");
      expect(hookState.selectedWords.length).toBe(2);
    });
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
    // Hook currently provides setSelectedList and markWordLearned
    expect(typeof hookState.setSelectedList).toBe("function");
    expect(typeof hookState.markWordLearned).toBe("function");
    // Deprecated section-based APIs should not exist (list-based APIs only)
    expect(hookState.selectedSectionId).toBeUndefined();
    expect(hookState.setSelectedSectionId).toBeUndefined();
  });
});
