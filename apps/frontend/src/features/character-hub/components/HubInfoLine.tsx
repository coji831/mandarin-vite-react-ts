/**
 * @file HubInfoLine.tsx
 * @description Character Detail Hub — Info line below the character card
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Shows pinyin + meaning info for the character.
 * Per wireframe: "mother · HSK 1 · Noun" format.
 *
 * Phase A: Placeholder with character + pinyin. Full meaning data in Phase B.
 *
 * Phase B: Shows character (pinyin) on the left, " · Meaning · HSK -" placeholder on the right.
 */

type HubInfoLineProps = {
  character: string;
  pinyin: string | null;
};

export function HubInfoLine({ character, pinyin }: HubInfoLineProps) {
  return (
    <div className="flex items-center justify-center gap-xs font-md text-secondary">
      <span className="fw-600 text-tertiary">{character}</span>
      <span className="text-primary-light">{pinyin ? `(${pinyin})` : "(...)"}</span>
      <span className="text-secondary">·</span>
      <span className="text-muted font-sm">HSK level coming soon</span>
    </div>
  );
}
