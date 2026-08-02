/**
 * @file hooks/useGeneratePassage.ts
 * @description Hook for triggering passage generation on demand.
 * Story 21.4 Fix: Wire onGeneratePassage in production mode (M1).
 * VisFix W6b: Guard against concurrent/double submission while generating.
 *
 * Covers loading, success, and error states.
 */
import { useState, useCallback, useRef } from "react";
import { generatePassage } from "../services/passageService";

export function useGeneratePassage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  // Ref guard — second line of defense against double-submit (the UI also
  // disables the CTA while generating, but the ref survives stale closures).
  const generatingRef = useRef(false);

  const generate = useCallback(async (hskLevel?: number) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);
    setHasError(false);
    setGeneratedId(null);
    try {
      const result = await generatePassage(hskLevel);
      setGeneratedId(result.id);
    } catch {
      setHasError(true);
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setGeneratedId(null);
    setHasError(false);
  }, []);

  return { isGenerating, generatedId, hasError, generate, reset };
}
