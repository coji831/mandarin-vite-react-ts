/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import useExamples, * as useExamplesHook from "../hooks/useExamples";
import * as examplesApi from "../services/examplesApi";

const mockExamples = [{ chinese: "我吃饭", pinyin: "wǒ chī fàn", english: "I eat" }];

function TestHost({ word, hskLevel, language = "en" }: any) {
  const { data, isLoading, error, cacheHit } = useExamples(word, hskLevel, language);
  if (isLoading) return <div>loading</div>;
  if (error) return <div>error:{error.message}</div>;
  return (
    <div data-testid="result" data-cachehit={cacheHit ? "true" : "false"}>
      {data?.[0]?.chinese ?? "none"}
    </div>
  );
}

describe("useExamples hook", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    useExamplesHook._clearInFlightPromisesForTests();
  });

  it("uses sessionStorage cache and sets cacheHit=true", async () => {
    const cacheKey = "abc-cache-key";
    vi.spyOn(examplesApi, "getCacheKey").mockResolvedValue(cacheKey as any);
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);

    sessionStorage.setItem(`examples_${cacheKey}`, JSON.stringify(mockExamples));

    render(<TestHost word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      const el = screen.getByTestId("result");
      expect(el).toBeInTheDocument();
      expect(el.getAttribute("data-cachehit")).toBe("true");
      expect(el.textContent).toContain("我吃饭");
    });

    // fetchExamples should not have been called because of sessionStorage hit
    expect(examplesApi.fetchExamples).not.toHaveBeenCalled();
  });

  it("dedupes concurrent requests for 60s", async () => {
    const cacheKey = "dedupe-key";
    vi.spyOn(examplesApi, "getCacheKey").mockResolvedValue(cacheKey as any);

    const fetchSpy = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve(mockExamples), 20)),
    );
    vi.spyOn(examplesApi, "fetchExamples").mockImplementation(fetchSpy as any);

    render(
      <>
        <TestHost word="饭" hskLevel={1} language="en" />
        <TestHost word="饭" hskLevel={1} language="en" />
      </>,
    );

    await waitFor(() => {
      const els = screen.getAllByTestId("result");
      expect(els.length).toBe(2);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("stores fresh fetch in sessionStorage and cacheHit=false", async () => {
    const cacheKey = "fresh-key";
    vi.spyOn(examplesApi, "getCacheKey").mockResolvedValue(cacheKey as any);
    vi.spyOn(examplesApi, "fetchExamples").mockResolvedValue(mockExamples as any);

    render(<TestHost word="饭" hskLevel={1} language="en" />);

    await waitFor(() => {
      const el = screen.getByTestId("result");
      expect(el.getAttribute("data-cachehit")).toBe("false");
      expect(sessionStorage.getItem(`examples_${cacheKey}`)).toBe(JSON.stringify(mockExamples));
    });
  });
});
