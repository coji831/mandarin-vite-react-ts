# Epic 8: Conversation Generation and Caching System

## Epic Summary

**Goal:** Implement on-demand conversation generation with intelligent caching, deterministic scaffolding for development, and cost-controlled TTS audio playback.

**Key Points:**

- Scaffolder-first approach enables parallel UI/backend development with deterministic fixtures
- Real conversation generation with AI integration and GCS caching for production scalability
- On-demand TTS audio generation with atomic caching and cost controls
- Comprehensive testing harness for CI/CD reliability without external dependencies
- Production-ready infrastructure with Terraform IaC and monitoring

**Status:** Completed

## Technical Overview

**Implementation Goal:** Build a complete conversation generation system that progresses from scaffolded development environment to production-ready AI-powered conversation generation with audio synthesis, featuring intelligent caching, cost controls, and comprehensive testing.

**Status:** Completed

**Last Update:** 2025-10-12

## Architecture Decisions

1. **Scaffolder-first development approach** - Create deterministic mock endpoints before real AI integration to enable parallel frontend/backend development and reliable testing. This reduces dependencies during development and provides stable fixtures for UI iteration.

2. **Three-phase implementation strategy** - Phase 1 (Scaffolding): deterministic fixtures and mock endpoints. Phase 2 (Integration): wire UI to scaffolder and validate end-to-end flows. Phase 3 (Production): replace scaffolders with real AI generation and TTS services.

3. **Cache-first architecture with deterministic keys** - Use `generatorVersion + promptHash` for cache keys to enable safe invalidation when prompts change while avoiding cache collisions. Check cache before expensive AI/TTS operations.

4. **On-demand audio generation only** - Generate TTS audio only when explicitly requested by user action to control costs. Use idempotent operations with atomic cache writes to prevent duplicate generation.

5. **Reuse Epic 1 TTS and caching patterns** - Leverage existing Google Cloud TTS integration, GCS lifecycle policies, and IAM configurations to accelerate implementation and ensure consistency.

## Technical Implementation

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flashcard     │    │   Conversation   │    │    Audio        │
│   Detail Page   │────▶│   Box UI         │────▶│   Playback      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Text Generator │    │   TTS Service   │
                       │   (Scaffolder    │    │   (Scaffolder   │
                       │    or Real AI)   │    │    or Google)   │
                       └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Text Cache     │    │   Audio Cache   │
                       │   (GCS JSON)     │    │   (GCS MP3)     │
                       └──────────────────┘    └─────────────────┘
```

### API Endpoints

**Text Generation:**

```
POST /api/conversation/text/generate
GET /conversation?wordId={id}  // Development only
```

**Parameters:**

- `wordId`: string (required) - Vocabulary word identifier
- `word`: string (required) - The vocabulary word text
- `generatorVersion`: string (required) - Generator version for cache keys
- `prompt`: string (optional) - Custom generation prompt

**Response:**

```typescript
{
  id: string;           // ${wordId}-${generatorVersion}-${promptHash}
  wordId: string;
  word: string;
  turns: Array<{
    speaker: string;
    text: string;
    translation?: string;
  }>;
  generatedAt: string;  // ISO timestamp
  generatorVersion: string;
  ### API Endpoints (current implementation)

  **Text Generation:**

  ```
  POST /api/conversation/text/generate
  ```
  promptHash?: string;
}
```
POST /api/conversation/audio/generate
GET /audio/{conversationId}  // Development only
```

**Parameters:**

- `conversationId`: string (required) - Conversation identifier
- `voice`: string (optional) - TTS voice preference
- `bitrate`: number (optional) - Audio quality setting

**Response:**

```typescript
{
  audioUrl: string;
  conversationId: string;
  timeline?: Array<{
   `generatorVersion`: string (optional) - (Note: current implementation does not include generatorVersion in cache key by default)
   `prompt`: string (optional) - Custom generation prompt
  }>;
  durationSeconds?: number;
  generatedAt: string;
  voice?: string;
}
```

  **Audio Generation:**

  ```
  POST /api/conversation/audio/generate
  GET /audio/{conversationId}  // Development only (proxy served by local-backend)
  ```
### Component Relationships

  ### File Structure (actual)

  local-backend/utils/
  ├── conversationGenerator.js
  ├── conversationProcessor.js
  ├── conversationCache.js
  └── scaffoldUtils.js

  local-backend/routes/
  └── conversation.js           // Unified conversation routes (text + audio)
└── ConversationTurns          // Turn-by-turn display component
    ├── SpeakerLabel
  **AI Services:** Google Gemini (Generative Language API) for conversation generation (current implementation). The code authenticates using a service account JWT.
    ├── DialogueText
    └── PlaybackHighlight      // Synchronized highlighting during audio
```

### Data Flow

1. **Text Generation Flow:**

  1. **Text Generation Flow:**

     ```
     User Request → Cache Check (GCS: convo/${wordId}/${hash}.json) → [Cache Hit: Return] → [Cache Miss: Generate via Gemini] → Store → Return
     ```
   ```
   User Request → Cache Check → [Cache Hit: Return] → [Cache Miss: Generate] → Store → Return
   ```
   ```
   Request → Fixture Lookup → Return Deterministic Data
   ```
├── components/
│   ├── ConversationBox.tsx
│   ├── ConversationTurns.tsx
│   ├── useAudioPlayback.ts
│   └── useConversationCache.ts
├── services/
│   ├── conversationApi.ts
│   ├── audioApi.ts
│   └── cacheService.ts
├── types/
│   └── conversation.types.ts
└── utils/
    ├── promptHashing.ts
    └── audioTimeline.ts

local-backend/routes/
├── conversation.js           // Scaffolder text endpoint
├── audio.js                 // Scaffolder audio endpoint
└── generator.js             // Real AI generation (Phase 3)

public/data/examples/conversations/
├── fixtures/
│   ├── conversation-hello.json
│   └── conversation-goodbye.json
└── audio/
    ├── hello-audio.mp3
    └── goodbye-audio.mp3

scripts/
└── harness-local.js         // CI testing harness
```

### Technology Stack

- **Frontend:** React, TypeScript, custom hooks for state management
- **Backend:** Express.js for local development, Node.js for production
- **AI Services:** Google Gemini (Generative Language API) for conversation generation (current implementation)
- **TTS:** Google Cloud Text-to-Speech API
- **Caching:** Google Cloud Storage with lifecycle policies
- **Infrastructure:** Terraform for IaC, Google Cloud Platform
- **Testing:** Jest, React Testing Library, custom harness scripts
- **Development:** Scaffolder endpoints with deterministic fixtures

### Security Considerations

- Service account keys managed through secrets management (never committed)
- Least-privilege IAM roles for GCS and TTS access
- Input validation and sanitization for user-provided vocabulary words
- Rate limiting on TTS endpoints to prevent cost overruns
- Cache keys designed to prevent enumeration or collision attacks

### Performance Requirements

- Text generation: < 2 seconds for cache miss, < 100ms for cache hit
- Audio generation: < 5 seconds for TTS, < 200ms for cached audio
- UI responsiveness: Loading states and error handling for all async operations
- Cache efficiency: 30-day lifecycle with automatic cleanup
