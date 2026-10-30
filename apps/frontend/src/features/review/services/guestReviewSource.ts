/**
 * @file services/guestReviewSource.ts
 * @description Session-local review queue for GUESTS (rework-proposal §1).
 *
 * BM-1's only lock is PERSISTENCE, not practice: a guest must be able to do a
 * review and meet the wall at "keep it". The SRS endpoints
 * (`/v1/review/items`, `/v1/review/result`) are requireAuth, so a guest queue
 * cannot come from them — it is derived here from content the API serves to
 * everyone (pinyin/tones pool, pinyin→Hanzi map, radicals), lives in memory for
 * the session, and is never written back. That is exactly what "session-local"
 * means: nothing to persist, so nothing to lock.
 *
 * Derivation rules (all three types are built so the prompt does not contain
 * the answer):
 *  - `pinyin`  → show the character, type its pinyin (glyph → answer).
 *  - `tones`   → show the character, pick its tone (glyph → answer).
 *  - `radicals` / `char-radical` → show the radical, pick its meaning.
 */
import {
  applyToneMark,
  extractToneNumber,
  resolveHanzi,
  stripToneAndDigits,
} from "@mandarin/shared-utils";
import { fetchPinyinCharacterMap } from "shared/services";
import { foundationsService, type PinyinTonesPool } from "features/foundations";
import { radicalsService, type RadicalData } from "features/radicals";
import type { ReviewItem, ReviewItemType } from "../types";

/** How many items a guest session holds (one page, no scheduling). */
export const GUEST_QUEUE_SIZE = 20;

/** Deterministic shuffle — a session is varied but a test run is repeatable. */
function rotate<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return items;
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

type Syllable = { syllable: string; glyph: string; tone: number };

/** Every pool syllable that resolves to a Hanzi glyph, deduped by glyph. */
function collectSyllables(
  pool: PinyinTonesPool,
  charMap: Record<string, string | null>,
): Syllable[] {
  const seen = new Set<string>();
  const out: Syllable[] = [];

  for (const combination of pool.combinations) {
    for (const tone of combination.tones) {
      if (!tone) continue;
      const glyph = resolveHanzi(tone, charMap);
      if (!glyph || seen.has(glyph)) continue;
      seen.add(glyph);
      out.push({ syllable: tone, glyph, tone: extractToneNumber(tone) });
    }
  }

  return out;
}

function pinyinItems(syllables: Syllable[]): ReviewItem[] {
  return syllables.map(({ syllable, glyph, tone }) => ({
    id: `guest-pinyin-${glyph}`,
    itemType: "pinyin-syllable" as ReviewItemType,
    itemId: glyph,
    // `front` is what the card shows as the answer; tone marks keep it readable.
    front: applyToneMark(stripToneAndDigits(syllable), tone),
    back: stripToneAndDigits(syllable),
    plainPinyin: stripToneAndDigits(syllable),
    character: glyph,
    correctTone: tone,
  }));
}

function toneItems(syllables: Syllable[]): ReviewItem[] {
  return syllables.map(({ syllable, glyph, tone }) => ({
    id: `guest-tone-${glyph}`,
    itemType: "tone-syllable" as ReviewItemType,
    itemId: glyph,
    front: applyToneMark(stripToneAndDigits(syllable), tone),
    back: stripToneAndDigits(syllable),
    plainPinyin: stripToneAndDigits(syllable),
    character: glyph,
    correctTone: tone,
  }));
}

/**
 * Radical items use the option step: the card shows the radical and offers four
 * meanings. `RadicalMeaningReviewStrategy` reads the expected answer from
 * `pinyinPlain`, so that field carries the correct option id here (same contract
 * the SRS payload uses).
 */
function radicalItems(radicals: RadicalData[], seed: number): ReviewItem[] {
  const pool = radicals.filter((r) => r.meaning);
  if (pool.length < 4) return [];

  return pool.map((radical) => {
    const distractors = rotate(
      pool.filter((r) => r.id !== radical.id),
      seed + radical.kangxi_index,
    ).slice(0, 3);
    const correctOptionId = `opt-${radical.id}`;
    const options = [
      { id: correctOptionId, glyph: radical.glyph, meaning: radical.meaning },
      ...distractors.map((d) => ({ id: `opt-${d.id}`, glyph: d.glyph, meaning: d.meaning })),
    ];
    return {
      id: `guest-radical-${radical.id}`,
      itemType: "radical" as ReviewItemType,
      itemId: radical.id,
      front: radical.name_pinyin,
      back: radical.meaning,
      pinyinPlain: correctOptionId,
      character: radical.glyph,
      meaning: radical.meaning,
      options: rotate(options, radical.kangxi_index),
    };
  });
}

/**
 * Build the guest's in-memory queue for the requested content type.
 * Returns an empty array when the type has no derivable items — the caller then
 * renders the same "no items" state a registered learner would see.
 */
export async function fetchGuestReviewItems(
  type: string,
  limit: number = GUEST_QUEUE_SIZE,
): Promise<ReviewItem[]> {
  if (type === "radicals" || type === "char-radical") {
    const radicals = await radicalsService.loadAllRadicals();
    return radicalItems(radicals, 7).slice(0, limit);
  }

  const [pool, charMap] = await Promise.all([
    foundationsService.getPinyinTonesPool(),
    fetchPinyinCharacterMap(),
  ]);
  const syllables = collectSyllables(pool, charMap);
  const items = type === "tones" ? toneItems(syllables) : pinyinItems(syllables);
  return rotate(items, 3).slice(0, limit);
}
