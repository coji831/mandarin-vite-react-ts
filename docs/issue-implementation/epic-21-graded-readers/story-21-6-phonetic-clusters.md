# Implementation 21-6: Phonetic Clusters

**Last Update:** July 24, 2026

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-6-phonetic-clusters.md`

## Technical Scope

Create the Phonetic Clusters browser: static data file with hand-curated clusters, PhoneticClustersTab component with cluster cards and HSK filter.

**Files:**

- `public/data/phonetic-clusters/clusters.json` — Static data file
- `apps/frontend/src/features/readers/components/PhoneticClustersTab/`

## Implementation Details

### Data Format (`clusters.json`)

```json
{
  "clusters": [
    {
      "id": "pc_0001",
      "phoneticPattern": "青",
      "pinyin": "qing",
      "description": "Characters containing 青 as phonetic component",
      "characters": [
        { "glyph": "请", "pinyin": "qǐng", "meaning": "please", "hskLevel": 1 },
        { "glyph": "情", "pinyin": "qíng", "meaning": "feeling", "hskLevel": 2 },
        { "glyph": "清", "pinyin": "qīng", "meaning": "clear", "hskLevel": 2 },
        { "glyph": "晴", "pinyin": "qíng", "meaning": "clear (weather)", "hskLevel": 2 }
      ],
      "pronunciationNote": "All characters share qing- onset but differ in tone"
    }
  ]
}
```

### Component Architecture

```
PhoneticClustersTab
├── HSKLevelFilter (dropdown/pills for filtering by level)
└── ClusterCardGrid
    └── ClusterCard
        ├── PhoneticPattern (e.g., 青 / qing)
        ├── Description
        ├── PronunciationNote
        └── CharacterList
            └── CharacterChip (clickable → opens CharacterHub)
```

### Key Behaviors

- Hand-curated for HSK 1-2 range
- Static data — no backend needed
- Clickable character → opens CharacterHub
- Filter by HSK level
- All states: loading (JSON fetch skeleton), empty (no clusters match filter), populated

## Architecture Integration

```
[Story 21.6: Phonetic Clusters]
├── Static data → public/data/phonetic-clusters/clusters.json
├── PhoneticClustersTab → feature/readers/components/
└── Integration → CharacterHub (via existing useCharacterHub/useEntityHub)
```

## Technical Challenges & Solutions

```
Problem: No automated source for phonetic cluster data.
Solution: Hand-curated static JSON for HSK 1-2 range. Data format designed for
         easy expansion. No automated generation needed.
```
