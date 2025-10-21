import { render } from "@testing-library/react";
import React, { useRef } from "react";
import { useProgressState } from "./useProgressState";
import { useProgressActions } from "./useProgressActions";
import { ProgressStateContext, ProgressDispatchContext } from "../context/ProgressContext";
import type { ProgressContextType, ExposedProgressState } from "../types/Progress";
import type { ProgressState as ListsProgressState } from "../types/ProgressNormalized";
import type { UserState as AppUserState } from "../reducers/userReducer";
import type { ProgressAction } from "../reducers/rootReducer";

// Mock fetch for vocabulary data
global.fetch = jest.fn();

function TestHook({ callback }: { callback: (hook: ProgressContextType) => void }) {
  const state = useProgressState((s) => s as ExposedProgressState);
  const actions = useProgressActions();
  const called = useRef(false);

  // assemble legacy-shaped object the same way the compat shim does
  const hook: ProgressContextType = {
    masteredProgress: state.ui?.masteredProgress || {},
    setMasteredProgress: (
      updater: React.SetStateAction<import("../types/Progress").MasteredProgressMap>
    ) => {
      // emulate legacy setter by serializing and calling actions.setMasteredProgress
      const current = state.ui?.masteredProgress || {};
      const next = typeof updater === "function" ? updater(current) : updater;
      const serialized: Record<string, Record<string, boolean>> = {};
      Object.keys(next || {}).forEach((listId) => {
        const set = next[listId] || new Set<string>();
        const obj: Record<string, boolean> = {};
        set.forEach((id: string) => (obj[id] = true));
        serialized[listId] = obj;
      });
      actions.setMasteredProgress(serialized);
    },
    selectedList: state.ui?.selectedList ?? null,
    setSelectedList: (v: React.SetStateAction<string | null>) =>
      actions.setSelectedList(
        typeof v === "function"
          ? (v as (p: string | null) => string | null)(state.ui?.selectedList ?? null)
          : (v as string | null)
      ),
    markWordLearned: actions.markWordLearned,
    selectedWords: state.ui?.selectedWords || [],
    setSelectedWords: (v: React.SetStateAction<import("../types/Vocabulary").Word[]>) =>
      actions.setSelectedWords(
        typeof v === "function"
          ? (
              v as (p: import("../types/Vocabulary").Word[]) => import("../types/Vocabulary").Word[]
            )(state.ui?.selectedWords || [])
          : (v as import("../types/Vocabulary").Word[])
      ),
    loading: state.ui?.isLoading ?? false,
    setLoading: (v: React.SetStateAction<boolean>) =>
      actions.setLoading(
        Boolean(
          typeof v === "function"
            ? (v as (p: boolean) => boolean)(state.ui?.isLoading ?? false)
            : (v as boolean)
        )
      ),
    calculateListProgress: (listId: string, wordCount: number) => {
      const masteredSet: Set<string> =
        (state.ui?.masteredProgress && state.ui!.masteredProgress[listId]) || new Set<string>();
      const mastered = masteredSet.size;
      const percent = wordCount === 0 ? 0 : Math.round((mastered / wordCount) * 100);
      return { mastered, percent };
    },
    error: state.ui?.error ?? "",
    setError: (v: React.SetStateAction<string>) =>
      actions.setError(
        String(
          typeof v === "function"
            ? (v as (p: string) => string)(state.ui?.error ?? "")
            : (v as string) || ""
        )
      ),
  };

  if (!called.current) {
    callback(hook);
    called.current = true;
  }
  return null;
}

describe("list-focused progress API (formerly useMandarinProgress)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with default state", () => {
    let hookState: ProgressContextType | undefined;
    const mockState: ExposedProgressState = {
      lists: {} as unknown as ListsProgressState,
      user: {} as unknown as AppUserState,
      ui: {
        selectedList: null,
        selectedWords: [],
        masteredProgress: {},
        isLoading: false,
        error: "",
      },
      selectedList: null,
      selectedWords: [],
      masteredProgress: {},
      loading: false,
      error: "",
    };

    const noopDispatch = (() => {}) as React.Dispatch<ProgressAction>;
    render(
      <ProgressStateContext.Provider value={mockState}>
        <ProgressDispatchContext.Provider value={noopDispatch}>
          <TestHook
            callback={(hook) => {
              hookState = hook;
            }}
          />
        </ProgressDispatchContext.Provider>
      </ProgressStateContext.Provider>
    );
    expect(hookState?.selectedList).toBeNull();
    expect(hookState?.selectedWords).toEqual([]);
  });

  it.skip("should select a vocabulary list and set words", async () => {
    // This test was skipped in the original suite and the current
    // ProgressContextType no longer exposes selectVocabularyList. Keep
    // the placeholder as skipped until the API is reintroduced.
  });

  it("should expose list-focused API functions", () => {
    let hookState: ProgressContextType | undefined;
    const mockState: ExposedProgressState = {
      lists: {} as unknown as ListsProgressState,
      user: {} as unknown as AppUserState,
      ui: {
        selectedList: null,
        selectedWords: [],
        masteredProgress: {},
        isLoading: false,
        error: "",
      },
      selectedList: null,
      selectedWords: [],
      masteredProgress: {},
      loading: false,
      error: "",
    };

    const noopDispatch = (() => {}) as React.Dispatch<ProgressAction>;
    render(
      <ProgressStateContext.Provider value={mockState}>
        <ProgressDispatchContext.Provider value={noopDispatch}>
          <TestHook
            callback={(hook) => {
              hookState = hook;
            }}
          />
        </ProgressDispatchContext.Provider>
      </ProgressStateContext.Provider>
    );
    // Hook currently provides setSelectedList and markWordLearned
    expect(typeof hookState!.setSelectedList).toBe("function");
    expect(typeof hookState!.markWordLearned).toBe("function");
  });
});
