/**
 * @file shared/hooks/__tests__/useSearchParamState.test.tsx
 * @description Unit tests for useSearchParamState — the shared URL-param
 * convention hook (Story 22.4 follow-up, Issue 4).
 *
 * Covers: default-when-absent, invalid→default validation, omit-when-default
 * (canonical URLs), replace-vs-push (via useNavigationType), the functional
 * setter preserving sibling params, and debounced writes (fake timers).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router-dom";
import type { UseSearchParamStateOptions } from "../useSearchParamState";
import { useSearchParamState } from "../useSearchParamState";

/** Renders the current router search so tests can assert URL writes. */
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="search">{location.search}</span>;
}

/** Renders the last navigation type so tests can assert replace vs push. */
function NavigationTypeProbe() {
  return <span data-testid="nav-type">{useNavigationType()}</span>;
}

type Tab = "pinyin" | "tones";

const TAB_OPTIONS: UseSearchParamStateOptions<Tab> = {
  defaultValue: "pinyin",
  parse: (raw) => (raw === "pinyin" || raw === "tones" ? raw : null),
};

function Harness<T>({ options }: { options: UseSearchParamStateOptions<T> }) {
  const [value, setValue] = useSearchParamState<T>("tab", options);
  return (
    <div>
      <span data-testid="value">{String(value)}</span>
      <button type="button" onClick={() => setValue("tones" as T)}>
        set-tones
      </button>
      <button type="button" onClick={() => setValue("pinyin" as T)}>
        set-default
      </button>
      {/* Functional form: toggles pinyin ⇄ tones, resolving against the latest value */}
      <button
        type="button"
        onClick={() => setValue((prev) => (prev === "pinyin" ? ("tones" as T) : ("pinyin" as T)))}
      >
        set-functional
      </button>
      <LocationProbe />
      <NavigationTypeProbe />
    </div>
  );
}

function renderHarness<T>(initialEntry: string, options: UseSearchParamStateOptions<T>) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Harness<T> options={options} />
    </MemoryRouter>,
  );
}

describe("useSearchParamState", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns defaultValue when the param is absent", () => {
    renderHarness("/test", TAB_OPTIONS);
    expect(screen.getByTestId("value")).toHaveTextContent("pinyin");
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });

  it("falls back to defaultValue for an invalid param value", () => {
    renderHarness("/test?tab=bogus", TAB_OPTIONS);
    expect(screen.getByTestId("value")).toHaveTextContent("pinyin");
  });

  it("omits the param from the URL when set back to defaultValue", () => {
    renderHarness("/test?tab=tones", TAB_OPTIONS);
    fireEvent.click(screen.getByRole("button", { name: "set-default" }));
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });

  it("writes with replace by default (no back-stack entry — Back exits the page)", () => {
    renderHarness("/test", TAB_OPTIONS);
    fireEvent.click(screen.getByRole("button", { name: "set-tones" }));
    // setSearchParams(..., { replace: true }) → navigationType REPLACE
    expect(screen.getByTestId("nav-type")).toHaveTextContent("REPLACE");
  });

  it("writes with push when replace: false (session starts keep a back-stack entry)", () => {
    renderHarness("/test", { ...TAB_OPTIONS, replace: false });
    fireEvent.click(screen.getByRole("button", { name: "set-tones" }));
    // setSearchParams(..., { replace: false }) → navigationType PUSH
    expect(screen.getByTestId("nav-type")).toHaveTextContent("PUSH");
  });

  it("keeps sibling params intact when writing one param (functional updater)", () => {
    renderHarness("/test?tab=pinyin&page=2", TAB_OPTIONS);
    fireEvent.click(screen.getByRole("button", { name: "set-tones" }));
    expect(screen.getByTestId("search")).toHaveTextContent("?tab=tones&page=2");
  });

  it("functional setter resolves against the latest value and preserves siblings", () => {
    // prev === "tones" → "pinyin" (default) → omitted; sibling `page` survives.
    renderHarness("/test?tab=tones&page=2", TAB_OPTIONS);
    fireEvent.click(screen.getByRole("button", { name: "set-functional" }));
    expect(screen.getByTestId("search")).toHaveTextContent("?page=2");
  });

  it("debounces writes when debounceMs is set (reset on each change)", () => {
    vi.useFakeTimers();
    renderHarness("/test", { ...TAB_OPTIONS, debounceMs: 500 });
    expect(screen.getByTestId("value")).toHaveTextContent("pinyin");

    fireEvent.click(screen.getByRole("button", { name: "set-tones" }));
    // Not written yet — debounce pending.
    expect(screen.getByTestId("search")).toHaveTextContent("");

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.getByTestId("search")).toHaveTextContent("");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("search")).toHaveTextContent("?tab=tones");
    expect(screen.getByTestId("value")).toHaveTextContent("tones");
  });
});
