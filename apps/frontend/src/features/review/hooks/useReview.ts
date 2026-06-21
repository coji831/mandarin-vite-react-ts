/**
 * useReview.ts
 * Phase 1 Review — Single hook managing the full flip-card review flow.
 * No Zustand, no session management. Uses local useState.
 */
import { useState, useCallback } from "react";
import type { ReviewItem, Rating, ReviewSource } from "../types";
import { reviewService } from "../services/reviewService";

export function useReview() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [source, setSource] = useState<ReviewSource>("due");
  const [contentType, setContentType] = useState("pinyin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (src: ReviewSource, type: string) => {
    setLoading(true);
    setError(null);
    setCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      const data = await reviewService.fetchItems(src, type);
      setItems(data);
      if (data.length === 0) {
        setCompleted(true); // Nothing to review
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const startReview = useCallback(
    (src: ReviewSource, type: string) => {
      setSource(src);
      setContentType(type);
      fetchItems(src, type);
    },
    [fetchItems],
  );

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const rate = useCallback(
    async (rating: Rating) => {
      const item = items[currentIndex];
      if (!item) return;

      try {
        await reviewService.recordRating(item.itemType, item.itemId, rating);
      } catch (err) {
        console.warn("[useReview] Failed to record rating:", err);
      }

      if (currentIndex + 1 >= items.length) {
        setCompleted(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      }
    },
    [items, currentIndex],
  );

  const currentItem = items[currentIndex] ?? null;

  return {
    currentItem,
    isFlipped,
    flip,
    rate,
    completed,
    loading,
    error,
    source,
    contentType,
    startReview,
    progress: { current: currentIndex + 1, total: items.length },
  };
}
