/**
 * useReview.ts
 * Phase 1 Review — Three-step active recall flow hook.
 * Manages the pinyin → tone → result → rating machine.
 * No Zustand, no session management. Uses local useState.
 */
import { useState, useCallback } from "react";
import type { ReviewItem, Rating, ReviewSource, ReviewStep, ReviewSessionResult } from "../types";
import { reviewService } from "../services/reviewService";

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
  const [contentType, setContentType] = useState("pinyin");

  /* ── Per-item state ────────────────────────────── */
  const [userPinyin, setUserPinyin] = useState("");
  const [userTone, setUserTone] = useState(0);
  const [pinyinCorrect, setPinyinCorrect] = useState(false);
  const [toneCorrect, setToneCorrect] = useState(false);

  /* ── Session results ────────────────────────────── */
  const [sessionResult, setSessionResult] = useState<ReviewSessionResult>({
    totalItems: 0,
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

  /* ── Fetch items ────────────────────────────────── */

  const fetchItems = useCallback(
    async (src: ReviewSource, type: string) => {
      setLoading(true);
      setError(null);
      setCurrentIndex(0);
      resetPerItem();
      setSessionResult({
        totalItems: 0,
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
          setStep("pinyin");
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
    (src: ReviewSource, type: string) => {
      setSource(src);
      setContentType(type);
      fetchItems(src, type);
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

      const expected = (item.pinyinPlain || item.front || "").toLowerCase();
      const isCorrect = expected.length > 0 && parsed.pinyin === expected;
      setPinyinCorrect(isCorrect);

      setSessionResult((prev) => ({
        ...prev,
        pinyinTotal: prev.pinyinTotal + 1,
        pinyinCorrect: prev.pinyinCorrect + (isCorrect ? 1 : 0),
      }));

      setStep("tone");
    },
    [items, currentIndex, step],
  );

  /* ── Step 2: Tone selection ─────────────────────── */

  const selectTone = useCallback(
    (tone: number) => {
      const item = items[currentIndex];
      if (!item || step !== "tone") return;

      setUserTone(tone);
      // If correctTone is undefined, the item doesn't have tone data
      // so we treat it as correct (no penalty for a non-existent tone requirement)
      const isCorrect = item.correctTone === undefined || tone === item.correctTone;
      setToneCorrect(isCorrect);

      setSessionResult((prev) => ({
        ...prev,
        toneTotal: prev.toneTotal + 1,
        toneCorrect: prev.toneCorrect + (isCorrect ? 1 : 0),
      }));

      setStep("result");
    },
    [items, currentIndex, step],
  );

  /* ── Step 3: Rating + advance ───────────────────── */

  const rateItem = useCallback(
    async (rating: Rating) => {
      const item = items[currentIndex];
      if (!item || step !== "result") return;

      try {
        await reviewService.recordRating(item.itemType, item.itemId, rating);
      } catch (err) {
        console.warn("[Review] Failed to record rating:", err);
      }

      setSessionResult((prev) => ({
        ...prev,
        ratings: { ...prev.ratings, [rating]: prev.ratings[rating] + 1 },
      }));

      if (currentIndex + 1 >= items.length) {
        setSessionResult((prev) => ({ ...prev, totalItems: prev.totalItems + 1 }));
        setStep("complete");
      } else {
        setCurrentIndex((i) => i + 1);
        resetPerItem();
        setStep("pinyin");
      }
    },
    [items, currentIndex, step, resetPerItem],
  );

  /* ── Computed values ────────────────────────────── */

  const currentItem = items[currentIndex] ?? null;
  const totalItems = items.length;

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
