/**
 * IMEQuestionView.tsx
 * IME Simulator Quiz — IME-specific question display
 *
 * Shows meaning clue + IME text input for character typing.
 * Story 21.18: Added phonetic hint display and radical hint toggle.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { getRadicalHint, searchPinyinCandidates } from "../../services/hintService";
import type { ImeCandidate } from "../../services/hintService";
import { Button, Input, Box, Chip } from "shared/components";
import "./IMEQuestionView.css";

/** Debounce for the live IME candidate fetch — reset on every keystroke (typing pause). */
const CANDIDATE_DEBOUNCE_MS = 500;
const CANDIDATE_PAGE_SIZE = 30;

export function IMEQuestionView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const question = questions[currentIndex];
  const hintsRemaining = useQuizSessionStore((s) => s.hintsRemaining);
  const showRadicalHint = useQuizSessionStore((s) => s.showRadicalHint);
  const currentPhoneticHint = useQuizSessionStore((s) => s.currentPhoneticHint);
  const consumeHint = useQuizSessionStore((s) => s.useHint);
  const applyRadicalPenalty = useQuizSessionStore((s) => s.applyRadicalPenalty);
  const [inputValue, setInputValue] = useState("");
  const [radicalHintData, setRadicalHintData] = useState<{
    glyph: string;
    meaning: string;
  } | null>(null);
  const [radicalLoading, setRadicalLoading] = useState(false);
  // Guards against re-fetching when the previous fetch resolved to no data
  // (e.g. 佘 has no radical). Without this, a null result would re-fire the
  // effect forever (V19 infinite refetch loop).
  const [radicalHintFetched, setRadicalHintFetched] = useState(false);

  // ─── Live IME candidates (VisFix W6a) ──────────────────────────────
  const [candidates, setCandidates] = useState<ImeCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  // Monotonic request id — ignores out-of-order responses from older fetches.
  const candidateRequestRef = useRef(0);

  // Load radical hint data when user requests it (once per question)
  useEffect(() => {
    if (showRadicalHint && question?.character && !radicalHintFetched && !radicalLoading) {
      setRadicalLoading(true);
      getRadicalHint(question.character)
        .then((data) => {
          setRadicalHintData(data);
          setRadicalHintFetched(true);
          setRadicalLoading(false);
        })
        .catch(() => {
          setRadicalHintFetched(true);
          setRadicalLoading(false);
        });
    }
  }, [showRadicalHint, question?.character, radicalHintFetched, radicalLoading]);

  useEffect(() => {
    setInputValue("");
    setRadicalHintData(null);
    setRadicalHintFetched(false);
    setCandidates([]);
    setCandidatesLoading(false);
    setCandidatesError(null);
    candidateRequestRef.current += 1; // invalidate any in-flight candidate fetch
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;
    useQuizSessionStore.getState().submitAnswer(inputValue.trim(), 0);
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit],
  );

  const handleRadicalHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    consumeHint();
    applyRadicalPenalty();
  }, [hintsRemaining, consumeHint, applyRadicalPenalty]);

  // ─── Live IME candidates (VisFix W6a) ──────────────────────────────

  /** Strip tone marks from pinyin (shè → she) for prefix matching. */
  const normalizePinyin = useCallback((p: string): string => {
    return p
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }, []);

  /**
   * Merge the fetched candidates with the correct answer so it is always
   * selectable — but only when the typed query matches the question's pinyin.
   * Appending an unrelated character to a wrong-pinyin candidate list would
   * confuse the user, so relevance is checked via a tone-stripped prefix match.
   */
  const mergeCandidates = useCallback(
    (
      results: ImeCandidate[],
      correctGlyph?: string | null,
      correctPinyin?: string,
      query?: string,
    ): ImeCandidate[] => {
      const seen = new Set<string>();
      const merged: ImeCandidate[] = [];
      for (const r of results) {
        if (!seen.has(r.glyph)) {
          seen.add(r.glyph);
          merged.push(r);
        }
      }
      if (correctGlyph && !seen.has(correctGlyph) && correctPinyin) {
        const q = (query ?? "").toLowerCase();
        const norm = normalizePinyin(correctPinyin);
        const relevant = norm.length > 0 && (norm.startsWith(q) || q.startsWith(norm));
        if (relevant) {
          merged.push({ glyph: correctGlyph, pinyin: correctPinyin, tone: 0, meaning: null });
        }
      }
      return merged;
    },
    [normalizePinyin],
  );

  // Debounced fetch while the user types pinyin. Edge cases per
  // frontend-input-handling: the timer resets on every keystroke (cleanup
  // clears the stale timer); out-of-order responses are ignored via requestId;
  // empty input clears candidates; a committed CJK glyph (after selecting a
  // candidate) does not re-trigger a search — the current candidates stay
  // visible so the user can switch before submitting.
  useEffect(() => {
    const trimmed = inputValue.trim();

    if (trimmed === "") {
      setCandidates([]);
      setCandidatesLoading(false);
      setCandidatesError(null);
      return;
    }

    if (!/^[a-zA-Z]+$/.test(trimmed)) return; // committed glyph — keep candidates

    setCandidatesLoading(true);
    setCandidatesError(null);
    const requestId = ++candidateRequestRef.current;

    const timer = setTimeout(() => {
      void searchPinyinCandidates(trimmed, CANDIDATE_PAGE_SIZE).then((response) => {
        if (candidateRequestRef.current !== requestId) return; // stale response
        if (!response) {
          setCandidates([]);
          setCandidatesError(`No candidates for "${trimmed}"`);
        } else {
          setCandidates(
            mergeCandidates(
              response.results,
              question?.character,
              question?.displayPinyin,
              trimmed,
            ),
          );
        }
        setCandidatesLoading(false);
      });
    }, CANDIDATE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue, question?.character, question?.displayPinyin, mergeCandidates]);

  const handleCandidateSelect = useCallback((candidate: ImeCandidate) => {
    // Commit the glyph as the answer — the controlled input reflects it and
    // Submit grades the glyph exactly as before.
    setInputValue(candidate.glyph);
  }, []);

  if (!question) {
    return (
      <Box variant="dark" padding="md">
        No question available
      </Box>
    );
  }

  return (
    <div className="ime-quiz-question mx-auto flex-col gap-xl">
      {/* Clue — meaning only */}
      <Box
        variant="surface"
        padding="xl"
        className="ime-quiz-question__clue radius-lg flex-col gap-md text-center"
      >
        <p className="ime-quiz-question__clue-label font-xs text-muted text-uppercase m-0 tracking-wide">
          Meaning
        </p>
        <p className="font-3xl fw-700 text-accent lh-tight">{question.meaning ?? "—"}</p>
      </Box>

      {/* IME Input */}
      <Box
        variant="elevated"
        padding="md"
        className="ime-quiz-question__input-area outline-none flex-col gap-md text-primary font-4xl w-full text-center"
      >
        <Input
          ref={inputRef}
          className="ime-quiz-question__input focus-ring"
          lang="zh"
          inputMode="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type character here..."
          autoComplete="off"
        />
        <p className="ime-quiz-question__steps font-sm text-muted text-center lh-normal m-0">
          ① Type the pinyin using your IME keyboard
          <br />② Select the correct character from IME candidates
        </p>
      </Box>

      {/* Live IME candidates (VisFix W6a) — appear as the user types pinyin */}
      {candidates.length > 0 && (
        <div
          className="ime-quiz-question__candidates w-full flex flex-wrap gap-sm"
          aria-label="IME candidates"
        >
          {candidates.map((c) => (
            <Chip
              key={c.glyph}
              interactive
              variant="surface"
              size="md"
              onClick={() => handleCandidateSelect(c)}
              ariaLabel={`${c.glyph} — ${c.pinyin}${c.meaning ? ` — ${c.meaning}` : ""}`}
              title={`${c.glyph} (${c.pinyin})${c.meaning ? ` — ${c.meaning}` : ""}`}
              className="h-auto py-sm radius-md flex-col items-center bg-surface-light-5"
            >
              <span className="font-lg text-primary lh-1">{c.glyph}</span>
              <span className="font-xs text-primary-light font-italic lh-1">{c.pinyin}</span>
              {c.meaning && <span className="font-xs text-muted lh-1">{c.meaning}</span>}
            </Chip>
          ))}
        </div>
      )}

      {candidatesLoading && candidates.length === 0 && (
        <p className="ime-quiz-question__candidates-status font-sm text-muted text-center m-0">
          Loading candidates...
        </p>
      )}

      {!candidatesLoading && candidatesError && candidates.length === 0 && (
        <p className="ime-quiz-question__candidates-status font-sm text-muted text-center m-0">
          {candidatesError}
        </p>
      )}

      <Button
        variant="primary"
        className="ime-quiz-question__submit w-full"
        onClick={handleSubmit}
        disabled={!inputValue.trim()}
      >
        Submit Answer
      </Button>

      {/* ─── Hint system (Story 21.18) ──────────────────────────── */}

      {/* Phonetic hint from previous wrong answer */}
      {currentPhoneticHint && (
        <Box variant="dark" padding="sm" className="ime-quiz-question__phonetic-hint w-full">
          {currentPhoneticHint.data ? (
            <p className="font-sm text-secondary m-0 lh-normal">
              💡 <strong>Hint:</strong> This character contains phonetic component{" "}
              <strong>{currentPhoneticHint.data.glyph}</strong> (pinyin:{" "}
              <strong>{currentPhoneticHint.data.pinyin}</strong>, meaning:{" "}
              <strong>{currentPhoneticHint.data.meaning}</strong>). Try to connect the sound!
            </p>
          ) : (
            <p className="font-sm text-secondary m-0 lh-normal">
              💡 This character doesn&apos;t have a phonetic component — try memorizing it by its
              visual structure.
            </p>
          )}
        </Box>
      )}

      {/* Hint pool indicator + radical hint toggle */}
      <div className="ime-quiz-question__hint-toggle flex-between w-full gap-md">
        <span className="font-sm text-muted">
          💡 x{hintsRemaining} hint{hintsRemaining !== 1 ? "s" : ""} remaining
        </span>

        {hintsRemaining > 0 && !showRadicalHint && (
          <button
            className="ime-quiz-question__radical-hint-btn font-sm text-accent bg-transparent ime-quiz-hint-toggle p-0"
            onClick={handleRadicalHint}
            type="button"
            aria-label="Show radical hint (consumes one hint, -5% penalty)"
          >
            🔍 Show radical hint
          </button>
        )}
      </div>

      {/* Radical hint content */}
      {showRadicalHint && (
        <Box
          variant="dark"
          padding="sm"
          className="ime-quiz-question__radical-hint w-full flex-col gap-xs"
        >
          {radicalLoading ? (
            <p className="font-sm text-muted m-0">Loading radical hint...</p>
          ) : (
            <>
              {radicalHintData ? (
                <p className="font-sm text-secondary m-0 lh-normal">
                  🔍 <strong>Radical:</strong> {radicalHintData.glyph} — {radicalHintData.meaning}
                </p>
              ) : (
                <p className="font-sm text-muted m-0">
                  No radical data available for this character.
                </p>
              )}
              <span className="text-warning font-xs ime-quiz-penalty-label">
                (-5% penalty applied)
              </span>
            </>
          )}
        </Box>
      )}
    </div>
  );
}
