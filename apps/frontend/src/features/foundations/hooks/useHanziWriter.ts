/**
 * @file useHanziWriter.ts
 * @description Hook encapsulating all hanzi-writer lifecycle management, state, and controls
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Manages dynamic import, character setup, teardown, playback controls, speed management,
 * stroke breakdown state, and stroke rules detection.
 *
 * @warning Accesses hanzi-writer internal API via `writer._options.strokeAnimationSpeed`.
 *   This is a private API — there is no public alternative in hanzi-writer v2.x.
 *   Monitor hanzi-writer releases for a public speed setter and migrate when available.
 */

import { useState, useRef, useEffect, useCallback } from "react";

import type { StrokeData } from "features/foundations/types";
import {
  determineStrokeRules,
  loadStrokeData,
  getCachedStrokeData,
} from "features/foundations/utils";

type UseHanziWriterReturn = {
  /** Ref to attach to the canvas container div */
  canvasRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the writer is ready for interaction */
  isReady: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Current stroke index being shown */
  currentStroke: number;
  /** Total number of strokes for the current character */
  totalStrokes: number;
  /** Whether animation is currently playing */
  isPlaying: boolean;
  /** Current animation speed multiplier */
  speed: number;
  /** SVG path strings for each stroke */
  strokePaths: string[];
  /** Stroke order rules that apply to the current character */
  appliedRules: string[];
  /** Loaded stroke data (for suggested characters) */
  strokeData: StrokeData | null;
  /** Start/resume full animation */
  handlePlay: () => void;
  /** Pause the current animation */
  handlePause: () => void;
  /** Step backward one stroke */
  handleStepBack: () => void;
  /** Step forward one stroke */
  handleStepForward: () => void;
  /** Change animation speed */
  handleSpeedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Jump to a specific stroke index (1-based) */
  handleStrokeSelect: (index: number) => void;
};

/**
 * Hook that manages hanzi-writer lifecycle, state, and controls.
 *
 * @param character - The Chinese character to display animation for
 * @returns Refs, state, and handlers for stroke animation UI
 */
export function useHanziWriter(character: string): UseHanziWriterReturn {
  const [strokeData, setStrokeData] = useState<StrokeData | null>(getCachedStrokeData());

  // Hanzi Writer state
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [strokePaths, setStrokePaths] = useState<string[]>([]);
  const [appliedRules, setAppliedRules] = useState<string[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null);
  const characterRef = useRef(character);
  const totalStrokesRef = useRef(0);
  const shouldAutoPlayRef = useRef(true);

  // Keep characterRef in sync
  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  // Load stroke data for suggested characters list (using shared cache)
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadStrokeData();
        setStrokeData(data);
      } catch (err) {
        // [Foundations] Failed to load stroke data for suggested characters
        console.error("[HanziWriter] Failed to load strokes data:", err);
      }
    };
    loadData();
  }, []);

  // Hanzi Writer setup — re-runs when character changes
  useEffect(() => {
    let cancelled = false;

    // Reset auto-play flag when a new character is loaded
    shouldAutoPlayRef.current = true;

    const setupWriter = async () => {
      setIsReady(false);
      setError(null);
      setCurrentStroke(0);
      setTotalStrokes(0);
      totalStrokesRef.current = 0;
      setIsPlaying(false);
      setStrokePaths([]);
      setAppliedRules([]);

      try {
        // Dynamic import — lazy-load only when tab is active
        const HanziWriter = (await import("hanzi-writer")).default;
        if (cancelled) return;

        // Create writer following the official hanzi-writer docs pattern:
        // charDataLoader receives (char, onComplete) and does NOT return anything.
        // onLoadCharDataSuccess / onLoadCharDataError handle loading status.
        if (!canvasRef.current) return;
        const writer = HanziWriter.create(canvasRef.current, character, {
          width: 200,
          height: 200,
          strokeColor: "#FF4444",
          showOutline: true,
          showCharacter: false,
          delayBetweenStrokes: 300,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          charDataLoader: (char: string, onComplete: (data: any) => void) => {
            fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${char}.json`)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
              .then((data) => onComplete(data))
              .catch(() => {
                // If CDN fails, character still renders outline but animation won't work
                // [Foundations] CDN stroke data unavailable for character
                console.warn(`[HanziWriter] Failed to load stroke data for "${char}" from CDN`);
              });
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onLoadCharDataSuccess: (data: any) => {
            if (cancelled) return;
            const count = data?.strokes?.length ?? 0;
            setTotalStrokes(count);
            totalStrokesRef.current = count;
            setStrokePaths(data?.strokes ?? []);
            setAppliedRules(determineStrokeRules(data));
            setIsReady(true);

            // Only auto-play when NOT in a manual step operation (e.g., step back)
            if (shouldAutoPlayRef.current) {
              writerRef.current?.animateCharacter({
                onComplete: () => {
                  if (!cancelled) {
                    setIsPlaying(false);
                    setCurrentStroke(totalStrokesRef.current);
                  }
                },
              });
              setIsPlaying(true);
            }
          },
          onLoadCharDataError: () => {
            if (!cancelled) {
              // [Foundations] Hanzi writer character data loader error
              console.warn("[HanziWriter] Character data loading failed");
            }
          },
        });

        if (cancelled) {
          writer.pauseAnimation();
          return;
        }

        writerRef.current = writer;
      } catch (err) {
        // [Foundations] Hanzi writer initialization failed
        console.error("[HanziWriter] Failed to initialize Hanzi Writer:", err);
        if (!cancelled)
          setError(
            "Failed to load stroke animation. Check your internet connection and try again.",
          );
      }
    };

    setupWriter();

    const canvasNode = canvasRef.current;
    return () => {
      cancelled = true;
      if (writerRef.current) {
        writerRef.current.pauseAnimation();
        writerRef.current = null;
      }
      // Clear the canvas div so the next writer instance starts fresh
      if (canvasNode) {
        canvasNode.innerHTML = "";
      }
    };
  }, [character]);

  // ── Control handlers ──────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;
    // Apply current speed before playing
    // ⚠️ WARNING: _options is a private API in hanzi-writer v2.x.
    //   There is no public speed setter — this is the only known workaround.
    //   If upgrading hanzi-writer, verify this still works and migrate if a
    //   public API becomes available.
    writer._options.strokeAnimationSpeed = speed;
    writer.animateCharacter({
      onComplete: () => {
        setIsPlaying(false);
        setCurrentStroke(totalStrokesRef.current);
      },
    });
    setIsPlaying(true);
  }, [speed]);

  const handlePause = useCallback(() => {
    writerRef.current?.pauseAnimation();
    setIsPlaying(false);
  }, []);

  const handleStepBack = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;
    // Pause any ongoing animation
    writer.pauseAnimation();
    setIsPlaying(false);

    const prevStroke = currentStroke;
    if (prevStroke <= 0) return;

    const newStroke = prevStroke - 1;
    setCurrentStroke(newStroke);

    // Prevent onLoadCharDataSuccess from auto-playing during this step operation
    shouldAutoPlayRef.current = false;

    // Reset the display and re-render up to the previous stroke
    // This is the best available approach since hanzi-writer v2.x has no stepBack()
    writer.setCharacter(characterRef.current).then(() => {
      if (newStroke === 0) {
        shouldAutoPlayRef.current = true;
        return;
      }
      // Animate through strokes 0..newStroke-1 with current speed
      const animateNext = (index: number) => {
        if (index >= newStroke) {
          shouldAutoPlayRef.current = true;
          return;
        }
        // ⚠️ WARNING: _options is a private API in hanzi-writer v2.x.
        //   See handlePlay for details on the private API dependency.
        writer._options.strokeAnimationSpeed = speed;
        writer.animateStroke(index, {
          onComplete: () => animateNext(index + 1),
        });
      };
      animateNext(0);
    });
  }, [currentStroke, speed]);

  const handleStepForward = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;

    const nextStroke = currentStroke + 1;
    if (nextStroke > totalStrokesRef.current) return;

    // Pause any ongoing animation
    writer.pauseAnimation();
    setIsPlaying(false);

    // Apply current speed
    // ⚠️ WARNING: _options is a private API in hanzi-writer v2.x.
    //   See handlePlay for details on the private API dependency.
    writer._options.strokeAnimationSpeed = speed;
    // Animate just the next stroke (0-indexed)
    writer.animateStroke(nextStroke - 1, {
      onComplete: () => {
        setCurrentStroke(nextStroke);
      },
    });
  }, [currentStroke, speed]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeed(value);
    // Speed is applied via _options before the next animateCharacter/animateStroke call
  }, []);

  /**
   * Jumps the animation to a specific stroke index (1-based).
   * Resets the display and re-animates strokes 0..target-1 so the user
   * sees the character built up to the selected stroke.
   */
  const handleStrokeSelect = useCallback((strokeIndex: number) => {
    const writer = writerRef.current;
    if (!writer) return;

    // Clamp strokeIndex to valid range [0, totalStrokes]
    const target = Math.max(0, Math.min(strokeIndex, totalStrokesRef.current));

    writer.pauseAnimation();
    setIsPlaying(false);

    if (target === 0) {
      setCurrentStroke(0);
      // Reset to show nothing
      writer.setCharacter(characterRef.current);
      return;
    }

    // Prevent auto-play during this operation
    shouldAutoPlayRef.current = false;
    setCurrentStroke(target);

    writer.setCharacter(characterRef.current).then(() => {
      // Animate strokes 0..target-1
      const animateNext = (index: number) => {
        if (index >= target) {
          shouldAutoPlayRef.current = true;
          return;
        }
        writer.animateStroke(index, {
          onComplete: () => animateNext(index + 1),
        });
      };
      animateNext(0);
    });
  }, []);

  return {
    canvasRef,
    isReady,
    error,
    currentStroke,
    totalStrokes,
    isPlaying,
    speed,
    strokePaths,
    appliedRules,
    strokeData,
    handlePlay,
    handlePause,
    handleStepBack,
    handleStepForward,
    handleSpeedChange,
    handleStrokeSelect,
  };
}
