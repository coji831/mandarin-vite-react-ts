/**
 * @file components/ToneDemoCard.tsx
 * @description The BM-2 WEDGE card on the home surface (rework-proposal §8).
 *
 * BM-2 §4 asks the dashboard to prove the delta in session 1: per-syllable tone
 * grading inside an HSK-aligned course. That grading engine is NOT built yet, so
 * this card does not pretend it is: it names the capability, states the quota in
 * text (a promise the product makes to guests — no account needed to try it) and
 * sends the learner to the closest REAL surface today (the four tones step of
 * the Blueprint) with one ghost CTA, so the page keeps exactly one primary.
 *
 * The wording is the 2026 fact-checked version: the differentiator is per-syllable
 * tone grading inside a course — not "pronunciation help", and not "no rival does
 * Chinese AI speaking".
 */
import { Box, Button, Icon } from "shared/components";
import "./ToneDemoCard.css";

export type ToneDemoCardProps = {
  /** Today's free tries, stated in text (quota is never shown as a bar alone). */
  freeTriesPerDay?: number;
  /** True once the live grading demo exists; until then the card is honest. */
  isLive?: boolean;
  onTry: () => void;
};

export function ToneDemoCard({ freeTriesPerDay = 3, isLive = false, onTry }: ToneDemoCardProps) {
  return (
    <Box variant="card-elevated" className="tone-demo-card flex-col gap-sm">
      <div className="flex items-center gap-xs">
        <Icon name="audio" size={16} aria-hidden />
        <h2 className="font-lg fw-600 text-primary m-0">Hear your tone</h2>
      </div>

      <p className="font-sm text-secondary m-0">
        Say one syllable and get a per-syllable tone grade — the one thing a text course cannot give
        you.
      </p>

      <p className="font-xs text-tertiary m-0">
        {isLive
          ? `${freeTriesPerDay} tries a day, no account needed.`
          : `Tone grading is not live yet. ${freeTriesPerDay} free tries a day will come with it — no account needed.`}
      </p>

      <div>
        <Button variant="ghost" size="sm" onClick={onTry}>
          {isLive ? "Try a tone" : "Practise the four tones"}
        </Button>
      </div>
    </Box>
  );
}
