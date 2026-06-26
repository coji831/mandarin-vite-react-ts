/**
 * useReview.ts
 * Phase 1 Review — Strategy-powered review flow hook.
 * Uses ReviewStrategy to determine step flow and evaluate answers.
 * No Zustand, no session management. Uses local useState.
 */
import { useState, useCallback } from "react";
import type { ReviewItem, Rating, ReviewSource, ReviewStep, ReviewSessionResult } from "../types";
import { reviewService } from "../services/reviewService";
import { getReviewStrategy } from "../engine/strategies";

/** Parse user pinyin input "hao3" into { pinyin: "hao", tone: 3 }. */
function parsePinyinInput(input: string): { pinyin: string; tone: number } {
  const cleaned = input.trim().toLowerCase();
  const match = cleaned.match(/^([a-z\u00fc]+)([0-4])?$/);
  if (!match) return { pinyin: cleaned, tone: 0 };
  return { pinyin: match[1], tone: match[2] ? parseInt(match[2], 10) : 0 };
}

export function useReview() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<ReviewStep>("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ReviewSource>("due");

  /* ── Per-item state ────────────────────────────── */
  const [userPinyin, setUserPinyin] = useState("");
  const [userTone, setUserTone] = useState(0);
  const [pinyinCorrect, setPinyinCorrect] = useState(false);
  const [toneCorrect, setToneCorrect] = useState(false);

  /* ── Session results ────────────────────────────── */
  const [sessionResult, setSessionResult] = useState<ReviewSessionResult>({
    pinyinCorrect: 0,
    pinyinTotal: 0,
    toneCorrect: 0,
    toneTotal: 0,
    ratings: { easy: 0, good: 0, again: 0 },
  });

  /* ── Helpers ────────────────────────────────────── */

  const resetPerItem = useCallback(() => {
    setUserPinyin("");
    setUserTone(0);
    setPinyinCorrect(false);
    setToneCorrect(false);
  }, []);

  const getStrategyForIndex = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return undefined;
      return getReviewStrategy(item.itemType);
    },
    [items],
  );

  /* ── Fetch items ────────────────────────────────── */

  const fetchItems = useCallback(
    async (src: ReviewSource, type: string) => {
      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      setSource(src);
      resetPerItem();
      setSessionResult({
        pinyinCorrect: 0,
        pinyinTotal: 0,
        toneCorrect: 0,
        toneTotal: 0,
        ratings: { easy: 0, good: 0, again: 0 },
      });
      try {
        const data = await reviewService.fetchItems(src, type);
        setItems(data);
        if (data.length === 0) {
          setStep("complete");
        } else {
          const strategy = getReviewStrategy(data[0].itemType);
          setStep(strategy?.initialStep ?? "pinyin");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load review items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [resetPerItem],
  );

  const startReview = useCallback(
    (src: ReviewSource, _type: string) => {
      fetchItems(src, _type);
    },
    [fetchItems],
  );

  /* ── Step 1: Pinyin submission ──────────────────── */

  const submitPinyin = useCallback(
    (input: string) => {
      const item = items[currentIndex];
      if (!item || step !== "pinyin") return;

      const parsed = parsePinyinInput(input);
      setUserPinyin(parsed.pinyin);
      setUserTone(parsed.tone);

      const strategy = getReviewStrategy(item.itemType);
      const evaluation = strategy
        ? strategy.evaluate(item, { type: "pinyin", value: parsed.pinyin })
        : { correct: false };
      const isCorrect = evaluation.correct;
      setPinyinCorrect(isCorrect);

      setSessionResult((prev) => ({
        ...prev,
        pinyinTotal: prev.pinyinTotal + 1,
        pinyinCorrect: prev.pinyinCorrect + (isCorrect ? 1 : 0),
      }));

      setStep("result");
    },
    [items, currentIndex, step, getReviewStrategy],
  );

  /* ── Step 2: Tone selection ─────────────────────── */

  const selectTone = useCallback(
    (tone: number) => {
      const item = items[currentIndex];
      if (!item || step !== "tone") return;

      setUserTone(tone);

      const strategy = getReviewStrategy(item.itemType);
      const evaluation = strategy
        ? strategy.evaluate(item, { type: "tone", value: tone })
        : { correct: false };
      const isCorrect = evaluation.correct;
      setToneCorrect(isCorrect);

      setSessionResult((prev) => ({
        ...prev,
        toneTotal: prev.toneTotal + 1,
        toneCorrect: prev.toneCorrect + (isCorrect ? 1 : 0),
      }));

      setStep("result");
    },
    [items, currentIndex, step, getReviewStrategy],
  );

  /* ── Step 3: Rating + advance ───────────────────── */

  const rateItem = useCallback(
    async (rating: Rating) => {
      const item = items[currentIndex];
      if (!item || step !== "result") return;

      try {
        await reviewService.recordRating(item.itemType, item.itemId, rating);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[Review] Failed to record rating:", err);
        }
      }

      setSessionResult((prev) => ({
        ...prev,
        ratings: { ...prev.ratings, [rating]: prev.ratings[rating] + 1 },
      }));

      if (currentIndex + 1 >= items.length) {
        setStep("complete");
      } else {
        setCurrentIndex((i) => i + 1);
        resetPerItem();
        const nextStrategy = getStrategyForIndex(currentIndex + 1);
        setStep(nextStrategy?.initialStep ?? "pinyin");
      }
    },
    [items, currentIndex, step, resetPerItem, getStrategyForIndex],
  );

  /* ── Computed values ────────────────────────────── */

  const currentItem = items[currentIndex] ?? null;
  const totalItems = items.length;
  const contentType = currentItem?.itemType ?? "pinyin";

  return {
    /* State */
    step,
    currentItem,
    loading,
    error,
    source,
    contentType,
    currentIndex,
    totalItems,
    userPinyin,
    userTone,
    pinyinCorrect,
    toneCorrect,
    sessionResult,
    /* Actions */
    startReview,
    submitPinyin,
    selectTone,
    rateItem,
    /* Progress */
    progress: { current: currentIndex + 1, total: totalItems },
  };
}
