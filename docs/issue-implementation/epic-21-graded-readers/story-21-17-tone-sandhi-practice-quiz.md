# Implementation 21-17: Tone Sandhi Practice Quiz

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-17-tone-sandhi-practice-quiz.md`

## Technical Scope

Create a new SandhiDrill quiz strategy with rule explanation cards and 10-question drill. Extend QuizAttempt.quizType enum.

**Files:**

- `apps/frontend/src/features/foundations/components/SandhiDrill.tsx` — **NEW**: SandhiDrill component (rule cards + drill)
- `apps/frontend/src/features/foundations/components/SandhiRuleCard.tsx` — **NEW**: rule explanation card
- `apps/frontend/src/features/foundations/components/index.ts` — update: export new components
- `apps/frontend/src/features/foundations/services/sandhiDrillService.ts` — **NEW**: question generation and scoring
- `apps/frontend/src/features/foundations/services/__tests__/sandhiDrillService.test.ts` — **NEW**: unit tests
- `apps/frontend/src/features/foundations/stores/quizStore.ts` — update: extend QuizAttempt for "sandhi-drill" type
- `apps/frontend/src/features/foundations/components/__stories__/SandhiDrill.stories.tsx` — **NEW**: stories
- `apps/frontend/src/mocks/handlers/quiz-handlers.ts` — update: MSW handlers for sandhi-drill endpoint

## Implementation Details

### SandhiDrill Strategy

```typescript
class SandhiDrillStrategy implements QuizStrategy {
  rules = [
    {
      id: "3-3-sandhi",
      name: "Third Tone Sandhi",
      formula: "3-3 → 2-3",
      description:
        "When two third-tone syllables appear together, the first changes to second tone.",
      examples: [
        { word: "你好", dictionary: "nǐ hǎo", spoken: "ní hǎo" },
        { word: "很好", dictionary: "hěn hǎo", spoken: "hén hǎo" },
        { word: "可以", dictionary: "kě yǐ", spoken: "ké yǐ" },
      ],
    },
    {
      id: "bu-before-4th",
      name: "不 (bù) Before 4th Tone",
      formula: "bù + 4th → bú + 4th",
      description:
        "The character 不 changes from tone 4 (bù) to tone 2 (bú) before another 4th-tone syllable.",
      examples: [
        { word: "不是", dictionary: "bù shì", spoken: "bú shì" },
        { word: "不对", dictionary: "bù duì", spoken: "bú duì" },
      ],
    },
    {
      id: "yi-before-4th",
      name: "一 (yī) Before 4th Tone",
      formula: "yī + 4th → yí + 4th",
      description: "一 changes from tone 1 (yī) to tone 2 (yí) before a 4th-tone syllable.",
      examples: [
        { word: "一个", dictionary: "yī gè", spoken: "yí gè" },
        { word: "一次", dictionary: "yī cì", spoken: "yí cì" },
      ],
    },
    {
      id: "yi-before-non4th",
      name: "一 (yī) Before Non-4th Tone",
      formula: "yī + (1st/2nd/3rd) → yì + (1st/2nd/3rd)",
      description:
        "一 changes from tone 1 (yī) to tone 4 (yì) before first, second, or third tone syllables.",
      examples: [
        { word: "一天", dictionary: "yī tiān", spoken: "yì tiān" },
        { word: "一年", dictionary: "yī nián", spoken: "yì nián" },
        { word: "一起", dictionary: "yī qǐ", spoken: "yì qǐ" },
      ],
    },
  ];

  generateQuestions(count: number): DrillQuestion[] {
    // Select random words from rule examples + additional word bank
    // Mix of all 4 rules, proportionally distributed
    // Return array of { word, dictionaryPinyin, spokenPinyin, rule, options }
  }
}
```

### QuizAttempt.quizType Extension

Add `"sandhi-drill"` to the QuizAttempt.quizType enum in the Prisma schema and frontend types.

## Architecture Integration

```
[Story 21.17: Tone Sandhi Practice Quiz]
├── Frontend — features/foundations/
│   ├── SandhiDrill — main component (rule cards + drill)
│   ├── SandhiRuleCard — individual rule explanation card
│   ├── sandhiDrillService — strategy implementation
│   └── quizStore — extended QuizAttempt type
└── Dependencies
    ├── 21.3 ToneSandhiService — sandhi rule data
    └── 21.16 Neutral Tone Extension — sandhi-aware scoring patterns
```
