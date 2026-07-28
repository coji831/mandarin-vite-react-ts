/**
 * @file hooks/useGeneratePassage.ts
 * @description Hook for triggering passage generation on demand.
 * Story 21.4 Fix: Wire onGeneratePassage in production mode (M1).
 *
 * Covers loading, success, and error states.
 */
import { useState, useCallback } from "react";
import { generatePassage } from "../services/passageService";

export function useGeneratePassage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const generate = useCallback(async (hskLevel?: number) => {
    setIsGenerating(true);
    setHasError(false);
    setGeneratedId(null);
    try {
      const result = await generatePassage(hskLevel);
      setGeneratedId(result.id);
    } catch {
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setGeneratedId(null);
    setHasError(false);
  }, []);

  return { isGenerating, generatedId, hasError, generate, reset };
}
