# State Management

**Category:** Frontend Development  
**Last Updated:** December 9, 2025

---

## Normalized State Structure

**When Adopted:** Epic 3 (State Management Refactor)  
**Why:** Avoid duplicate data, fast lookups by ID  
**Use Case:** Lists of entities (vocabulary words, progress items)

### Minimal Example

```typescript
// ❌ Array-based (slow lookups, duplicates)
interface State {
  words: Word[];
}

// ✅ Normalized (fast lookups, single source of truth)
interface State {
  wordsById: Record<string, Word>;
  wordIds: string[];
}

// Adding item
function addWord(state: State, word: Word): State {
  return {
    wordsById: { ...state.wordsById, [word.id]: word },
    wordIds: [...state.wordIds, word.id],
  };
}

// Accessing items (selector)
function selectAllWords(state: State): Word[] {
  return state.wordIds.map((id) => state.wordsById[id]);
}

function selectWord(state: State, id: string): Word | undefined {
  return state.wordsById[id];
}
```

### Key Lessons

- Use `Record<string, T>` for O(1) lookups
- Keep separate ID array for ordering
- Write selectors to hide structure complexity

### When to Use

Any list of entities (users, items, posts, etc.)

---

## localStorage Persistence

**When Adopted:** Epic 2 (Vocabulary Learning Flow)  
**Why:** Persist user progress between sessions  
**Use Case:** User progress, app preferences

### Minimal Example

```typescript
// 1. Save to localStorage
function saveProgress(progress: Progress): void {
  localStorage.setItem("user-progress", JSON.stringify(progress));
}

// 2. Load from localStorage (with fallback)
function loadProgress(): Progress {
  const saved = localStorage.getItem("user-progress");
  if (!saved) return DEFAULT_PROGRESS;

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to parse progress:", error);
    return DEFAULT_PROGRESS;
  }
}

// 3. Auto-save on state change
useEffect(() => {
  saveProgress(progress);
}, [progress]);

// 4. Migration strategy (version your data!)
interface Progress {
  version: number; // Always include version
  data: ProgressData;
}

function loadProgress(): Progress {
  const saved = loadFromStorage();
  if (saved.version < 2) {
    return migrateV1ToV2(saved);
  }
  return saved;
}
```

### Key Lessons

- Always wrap in try-catch (localStorage can fail)
- Version your data structure for migrations
- Use debounce for frequent updates (avoid performance hit)
- localStorage has 5-10MB limit (check quota)

### When to Use

Client-side persistence, offline-first apps

---

## CSV Data Loading with PapaParse

**When Adopted:** Epic 2 (Vocabulary Learning Flow)  
**Why:** Store vocabulary in editable CSV, load at runtime  
**Use Case:** 10k+ vocabulary words without hardcoding

### Minimal Example

```typescript
// 1. Install: npm install papaparse @types/papaparse

import Papa from "papaparse";

interface VocabRow {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
}

// 2. Load CSV from public folder
async function loadVocabulary(): Promise<VocabRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse("/data/vocabulary/hsk1.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as VocabRow[]),
      error: (error) => reject(error),
    });
  });
}

// 3. Use in component
useEffect(() => {
  loadVocabulary().then((data) => {
    console.log(`Loaded ${data.length} words`);
  });
}, []);
```

### Key Lessons

- Set `header: true` to use first row as object keys
- Store CSV in `public/data/` for easy editing
- Validate CSV structure (check required columns exist)

### When to Use

Large datasets that change frequently, non-developer editable content

---

**Related Guides:**

- [React Patterns](./frontend-react-patterns.md) — Context API, Router
- [Backend Architecture](./backend-architecture.md) — Server-side state
