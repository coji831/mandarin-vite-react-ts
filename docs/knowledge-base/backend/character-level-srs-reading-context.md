# Character-Level SRS with Reading Context

**Category:** Backend Development  
**Last Updated:** June 26, 2026

---

## Why

Chinese characters are not phonetic — a single glyph can have multiple pronunciations depending on the word it appears in. For example, 了 is pronounced **le** (past tense marker) in 吃了 but **liǎo** (to finish) in 了解. A spaced-repetition system (SRS) that tracks progress at the word level misses the fact that knowing 好 in 爱好 (hào) transfers to 好 in 好看 (hǎo). Conversely, tracking only at the character level loses the reading context needed to quiz the user accurately.

This article documents the pattern for handling polyphonic Chinese characters: character-level SRS tracking with word-level reading context inferred at review time.

---

## Use Case

- A learner studies the word 爱好 (àihào). The system records progress for the character 好.
- Later, the learner encounters 很好 (hěnhǎo). The same character 好 appears, but now it's read as hǎo.
- When reviewing 好 via SRS, the system shows the most recent word context — 好 within 爱好 (hào) or 好 within 很好 (hǎo) — and uses the corresponding reading.

This pattern applies to all polyphonic characters: 了 (le vs liǎo), 行 (xíng vs háng), 长 (cháng vs zhǎng), 还 (hái vs huán), and hundreds more.

---

## Key Concepts

### Three-Layer Approach

| Layer | Concept                       | Purpose                                  | Example                                           |
| ----- | ----------------------------- | ---------------------------------------- | ------------------------------------------------- |
| 1     | **CharacterProgress**         | One SRS record per glyph per user        | 好 has one progress record, regardless of reading |
| 2     | **WordStudyContext**          | Which word provided the learning context | When reviewing 好, show context from 爱好 or 很好 |
| 3     | **Word.spokenPinyinOverride** | Tone sandhi adjustment                   | 你好 = nǐ hǎo (dict) → ní hǎo (spoken)            |

### How It Differs from Word-Level SRS

| Criteria            | Character-Level (this pattern)                      | Word-Level (anti-pattern)                        |
| ------------------- | --------------------------------------------------- | ------------------------------------------------ |
| Knowledge transfer  | ✅ Knowing 爱 from 爱好 helps with 爱情             | ❌ 爱 only known in context of 爱好              |
| Character Hub SRS   | ✅ One query: `WHERE characterId = "好"`            | ❌ Must aggregate across all words containing 好 |
| HSK unlock tracking | ✅ Count unique known characters                    | ❌ Must sum word-level knowledge                 |
| Multi-reading chars | ⚠️ Needs WordStudyContext for review context        | ✅ Each word has one unambiguous reading         |
| Review simplicity   | ⚠️ Slightly more complex (join to WordStudyContext) | ✅ Direct — review the word itself               |

### WordStudyContext Bridge

The `WordStudyContext` table connects a character to the word through which the user studied it:

```prisma
model WordStudyContext {
  id          String   @id @default(uuid())
  userId      String
  characterId String
  wordId      String   // The word through which user studied this character
  studiedAt   DateTime @default(now())

  @@unique([userId, characterId, wordId])
  @@index([userId, characterId, studiedAt])
}
```

### Review Flow

1. User studies "爱好" (word-level learning activity)
2. System creates/updates `CharacterProgress` for 爱 and 好
3. System inserts `WordStudyContext` { userId, characterId: "好", wordId: "爱好" }
4. When SRS reviews 好, system fetches most recent `WordStudyContext` → shows 好 within 爱好 (hào)
5. Later user studies "很好" → same `CharacterProgress` for 好, new `WordStudyContext` → review context updates to 很好 (hǎo)
6. Both readings are preserved in `WordStudyContext` history

### Review Card Example

```
Front:  了
Back:
  Primary reading: le (past tense marker)
  Also read as:    liǎo (to finish)

  Studied via: "吃了" (chī le) — "ate"
              "了解" (liǎojiě) — "to understand"

  Your confidence: 0.75 (Good)
```

---

## DO/DON'T Examples

### DO: Track SRS at the character level

```prisma
model CharacterProgress {
  id          String   @id @default(uuid())
  userId      String
  characterId String   // references content_id like "ch_0342"
  confidence  Float    @default(0.0)
  nextReview  DateTime
  interval    Int      @default(0)    // days
  easeFactor  Float    @default(2.5)
  lapseCount  Int      @default(0)
  lastReview  DateTime?

  @@unique([userId, characterId])
  @@index([userId, nextReview])
}
```

### DO: Record reading context when studying

```prisma
// Create context whenever user studies a character through a word
await prisma.wordStudyContext.create({
  data: {
    userId: user.id,
    characterId: "好",
    wordId: "爱好",
  },
});
```

### DON'T: Store reading as an intrinsic character property

```prisma
// BAD — a single character doesn't have one fixed reading
model Character {
  id     String @id
  pinyin String // WRONG: which reading? le or liǎo?
}
```

### DON'T: Track SRS at the word level for single characters

```prisma
// BAD — knowledge doesn't transfer between words sharing the same glyph
model Progress {
  id     String @id
  userId String
  wordId String // WRONG: 好 in 爱好 vs 好 in 很好 are different records
}
```

### DO: Use a separate CharacterReading table

```prisma
model CharacterReading {
  id          String  @id @default(uuid())
  characterId String
  pinyin      String  // "le" or "liǎo"
  tone        Int     // 1-5
  coreMeaning String  // "past tense marker" for 了(le)
  isPrimary   Boolean @default(false)

  character Character @relation(fields: [characterId], references: [id])
  @@unique([characterId, pinyin, tone])
}
```

---

## Cross-References

- [Spaced Repetition Algorithms](../learning-theory/spaced-repetition-algorithms.md) — SM-2 implementation details
- [Pre-Adaptation Static/Dynamic Separation](./pre-adaptation-static-dynamic-separation.md) — `content_id` conventions for progress models
- [Modeling Chinese as a Knowledge Graph](../learning-theory/modeling-chinese-knowledge-graph.md) — How characters connect through radical and word relationships
