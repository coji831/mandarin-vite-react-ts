# Implementation 8-1: Design Conversation Schema & Scaffolder

## Technical Scope

- TypeScript schema definitions for `Conversation` and `ConversationAudio` types
- JSON fixture files with deterministic conversation data
- Schema validation utilities and type guards
- Documentation for schema usage and constraints
- Fixture generation utilities for testing

## Implementation Details

```typescript
// src/features/conversation/types/conversation.types.ts
export interface Conversation {
  id: string; // Note: runtime sets this to `${wordId}-${hash}` (short deterministic hash derived from wordId)
  wordId: string;
  word: string;
  meaning?: string;
  context?: string;
  turns: ConversationTurn[];
  generatedAt: string; // ISO 8601 timestamp
  generatorVersion: string; // e.g., "v1", "v2" for cache invalidation
  promptHash?: string; // Hash of generation prompt for cache keys
}

export interface ConversationTurn {
  speaker: string; // "A", "B", or descriptive names
  text: string; // Dialogue text in target language
  translation?: string; // Optional English translation
}

export interface ConversationAudio {
  conversationId: string;
  audioUrl: string;
  durationSeconds?: number;
  timeline?: AudioTimeline[]; // For turn-by-turn highlighting
  generatedAt: string;
  voice?: string; // TTS voice identifier
  bitrate?: number; // Audio quality setting
}

export interface AudioTimeline {
  mark: string; // "turn-1", "turn-2", etc.
  timeSeconds: number; // Start time of this turn
}

// Validation functions
export function isValidConversation(data: unknown): data is Conversation {
  const conv = data as Conversation;
  return (
    typeof conv?.id === "string" &&
    typeof conv?.wordId === "string" &&
    typeof conv?.word === "string" &&
    Array.isArray(conv?.turns) &&
    conv.turns.length >= 3 &&
    conv.turns.length <= 5 &&
    conv.turns.every(isValidTurn) &&
    typeof conv?.generatedAt === "string" &&
    typeof conv?.generatorVersion === "string"
  );
}

export function isValidTurn(turn: unknown): turn is ConversationTurn {
  const t = turn as ConversationTurn;
  return (
    typeof t?.speaker === "string" &&
    typeof t?.text === "string" &&
    t.text.length > 0 &&
    t.text.length <= 200 // Reasonable limit for language learning
  );
}
```

**Fixture Examples:**

```json
// public/data/examples/conversations/fixtures/hello-basic.json
{
  "id": "hello-v1-abc123",
  "wordId": "hello",
  "word": "你好",
  "meaning": "hello",
  "context": "greeting",
  "turns": [
    {
      "speaker": "A",
      "text": "你好！",
      "translation": "Hello!"
    },
    {
      "speaker": "B",
      "text": "你好！很高兴见到你。",
      "translation": "Hello! Nice to meet you."
    },
    {
      "speaker": "A",
      "text": "我也很高兴见到你。",
      "translation": "Nice to meet you too."
    }
  ],
  "generatedAt": "2025-10-10T12:00:00Z",
  "generatorVersion": "v1",
  "promptHash": "abc123def456"
}
```

> Note (runtime): the running local-backend and Vercel handlers set `conversation.id` to a short runtime id in the form `${wordId}-${hash}` where `hash` is a deterministic short hash currently derived from `wordId`. The cache paths used by the code are `convo/${wordId}/${hash}.json` for text and `convo/${wordId}/${hash}.mp3` for audio when `GCS_BUCKET_NAME` is configured.

## Architecture Integration

```
Schema Types → Used by all conversation components
     ↓
Fixture Files → Feed scaffolder endpoints and tests
     ↓
Validation Utils → Ensure data integrity across system
     ↓
Type Guards → Runtime validation for external data
```

This implementation provides the foundational data structures that all subsequent conversation features depend on. The schemas enforce business rules (3-5 turns, reasonable text length) while the fixtures enable deterministic testing.

## Technical Challenges & Solutions

**Challenge:** Ensuring fixture data remains synchronized with evolving schema

```typescript
// Solution: Automated fixture validation in CI
// scripts/validate-fixtures.js
const fixtures = await loadAllFixtures();
const validationResults = fixtures.map((fixture) => ({
  file: fixture.path,
  valid: isValidConversation(fixture.data),
  errors: validateConversationDetailed(fixture.data),
}));

if (validationResults.some((r) => !r.valid)) {
  throw new Error("Fixture validation failed");
}
```

**Challenge:** Generating deterministic conversation IDs for caching

```typescript
// Solution: Deterministic ID generation based on content
export function generateConversationId(
  wordId: string,
  generatorVersion: string,
  promptHash: string
): string {
  // Runtime currently uses a short hash derived from wordId for deterministic scaffold fixtures.
  // If migrating to version-aware keys, you could use: `${wordId}-${generatorVersion}-${promptHash.substring(0, 8)}`
  return `${wordId}-${shortHash(wordId)}`;
}

export function generatePromptHash(prompt: string, word: string): string {
  return crypto.createHash("sha256").update(`${prompt}:${word}`).digest("hex");
}
```

**Challenge:** Supporting both development fixtures and production schemas

```typescript
// Solution: Environment-aware schema loading
export async function loadConversationSchema(): Promise<ConversationSchema> {
  if (process.env.NODE_ENV === "development") {
    return await loadFixtureSchema();
  }
  return await loadProductionSchema();
}
```

## Testing Implementation

- Unit tests for all type guards and validation functions
- Fixture validation runs in CI pipeline
- Schema compatibility tests between versions
- Performance tests for large fixture sets
- Integration tests with actual API responses
