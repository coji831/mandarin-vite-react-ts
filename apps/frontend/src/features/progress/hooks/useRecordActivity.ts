/**
 * @file apps/frontend/src/features/progress/hooks/useRecordActivity.ts
 * @description Public API hook for recording progress events (Story 17.2)
 */
import { useCallback } from "react";
import { useProgressStore } from "../stores/progressStore";
import { progressApi } from "../services/progressService";

type RecordActivityParams = {
  feature: string;
  wordId: string;
  correct: boolean;
  data?: Record<string, unknown>;
};

export function useRecordActivity() {
  const updateWordProgress = useProgressStore((s) => s.updateWordProgress);

  return useCallback(
    async (params: RecordActivityParams) => {
      const { feature, wordId, correct, data } = params;

      // Optimistic update
      updateWordProgress(wordId, {
        studyCount: ((data?.studyCount as number) ?? 0) + 1,
        correctCount: correct ? 1 : 0,
      });

      // Server sync
      try {
        await progressApi.recordEvent({
          type: "record-answer",
          feature,
          data: { wordId, correct, ...data },
        });
      } catch (err) {
        console.error("Failed to sync progress event:", err);
      }
    },
    [updateWordProgress],
  );
}
