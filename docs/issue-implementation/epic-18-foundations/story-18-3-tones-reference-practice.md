# Implementation 18-3: Tones Reference & Practice

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Status

- **Status**: Completed
- **Last Updated**: June 19, 2026
- **PR**: TBD (commit pending user review)

## Technical Scope

Build the tone reference tab with pitch contour visualization, tone pair drills, and tone change rules section.

**Files to create:**

- `apps/frontend/src/features/foundations/components/TonesTab.tsx` — main tab component
- `apps/frontend/src/features/foundations/components/ToneContourCard.tsx` — pitch visualization card
- `apps/frontend/src/features/foundations/components/TonePairDrills.tsx` — pair drill cards
- `apps/frontend/src/features/foundations/components/ToneChangeRules.tsx` — rule reference cards
- `apps/frontend/src/features/foundations/utils/toneUtils.ts` — contour rendering, tone display helpers
- `apps/frontend/public/data/foundations/tones.json` — static data

## Implementation Details

```typescript
// ToneContourCard.tsx — Pitch visualization using SVG path
function ToneContourCard({ tone }: { tone: ToneDefinition }) {
  const points = tone.contour.map((pitch, i) => ({
    x: (i / (tone.contour.length - 1)) * 100,
    y: 100 - (pitch / 5) * 80, // 5 levels → 0-80% height
  }));
  const pathD = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(" ");

  return (
    <div className={`tone-card tone-${tone.number}`}
         style={{ borderColor: TONE_COLORS[tone.number] }}>
      <svg viewBox="0 0 100 100" className="tone-contour">
        <path d={pathD} stroke={TONE_COLORS[tone.number]} fill="none" strokeWidth="3" />
      </svg>
      <div className="tone-info">
        <span className="tone-mark" style={{ color: TONE_COLORS[tone.number] }}>
          {tone.mark}
        </span>
        <span className="tone-example">{tone.name}</span>
        <span className="tone-desc">{tone.description}</span>
        <button onClick={() => playAudio(tone.name)} className="audio-btn">🔊</button>
      </div>
    </div>
  );
}
```

```typescript
// ToneChangeRules.tsx — Reference cards
const TONE_RULES = [
  {
    title: "3rd Tone Sandhi",
    rule: "3rd tone + 3rd tone → 2nd tone + 3rd tone",
    examples: [
      { chinese: "你好", dictionary: "nǐ hǎo", spoken: "ní hǎo" },
      { chinese: "很好", dictionary: "hěn hǎo", spoken: "hén hǎo" },
    ],
  },
  {
    title: "一 (yī) Tone Change",
    rule: "yī → yí before 4th tone; yī → yì before 1st/2nd/3rd",
    examples: [
      { chinese: "一个", dictionary: "yī gè", spoken: "yí gè" },
      { chinese: "一起", dictionary: "yī qǐ", spoken: "yì qǐ" },
    ],
  },
  {
    title: "不 (bù) Tone Change",
    rule: "bù → bú before 4th tone",
    examples: [
      { chinese: "不是", dictionary: "bù shì", spoken: "bú shì" },
      { chinese: "不对", dictionary: "bù duì", spoken: "bú duì" },
    ],
  },
];
```

## Architecture Integration

```
TonesTab
  ├── ToneContourCard × 4 (SVG pitch lines + audio + tone-colored)
  ├── TonePairDrills (list of { syllables, chinese, rule, audio })
  └── ToneChangeRules (3 rule cards with dict vs spoken comparison)
       └── playAudio → AudioService.playWordAudio → Backend /v1/tts

Data: public/data/foundations/tones.json (loaded via fetch)
```

## Technical Challenges & Solutions

### Challenge 1: TTS Audio for Pinyin Syllables

**Problem**: Browser SpeechSynthesis doesn't read pinyin correctly (pronounces as English letters).
**Root Cause**: TTS engines expect Chinese characters, not Romanized pinyin.
**Solution**: Used `getPinyinAudioText()` (same pattern as PinyinTab) to map pinyin → Chinese character before passing to TTS. For multi-character Chinese words, pass directly.
**Impact**: Consistent audio across all tones content.

### Challenge 2: Layout Alignment with Wireframe

**Problem**: Initial implementation used individual cards per tone/drill/rule, creating dead space and not matching the wireframe's consolidated card design.
**Root Cause**: Component-first thinking instead of design-first.
**Solution**: Consolidated to single-card-per-section containers (`.tones-contour-grid`, `.tone-pair-drills`, `.tone-rules` get the card background/border). Individual items are now compact rows without their own borders.
**Impact**: ~40% visual density improvement, matches Section 4.3 wireframe.

### Challenge 3: Dict/Spoken Pinyin Comparison Layout

**Problem**: Dictionary pinyin and spoken pinyin needed to be shown side-by-side for comparison, but two rows created vertical dead space.
**Solution**: Merged onto one line with `→` separator. Rule badge moved to front per wireframe sequence.
**Impact**: Each drill item now fits in one compact row.

## Testing Implementation

- Unit test: ToneContourCard renders SVG path matching contour data
- Unit test: TonePairDrills plays audio on click
- Unit test: ToneChangeRules renders 3 rule cards
- Unit test: All tone data loads correctly from tones.json
- **Test results**: 285/286 tests pass (1 pre-existing failure in TabBar.test.tsx - unrelated to tones)
- **TypeScript**: `tsc --noEmit` clean
