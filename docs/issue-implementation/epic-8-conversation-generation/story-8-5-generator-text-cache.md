# Implementation 8-5: Generator — Text generation & cache (backend)

## Technical Scope

- Real AI-powered conversation generation replacing scaffolder
- GCS-based caching system with deterministic cache keys
- Prompt hash computation for cache invalidation
- Integration with Google Gemini (Generative Language API) for conversation generation (current implementation)
- Cache hit/miss logic with atomic write operations

## Implementation Details

```typescript
// local-backend/services/conversationGenerator.ts
import { Storage } from "@google-cloud/storage";
import { createHash } from "crypto";
import { Conversation } from "../types/conversation.types";

interface GenerationParams {
  wordId: string;
  word: string;
  meaning?: string;
  generatorVersion: string;
  customPrompt?: string;
}

export class ConversationGenerator {
  private storage: Storage;
  private bucketName: string;
  private aiClient: any; // Gemini JWT-based client in current implementation

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });
    this.bucketName = process.env.GCS_BUCKET_NAME || "mandarin-conversations";
    this.aiClient = this.initializeAIClient();
  }

  private initializeAIClient() {
    // Current implementation uses Gemini via service account JWT (see local-backend/utils/conversationGenerator.js)
    // Example: initialize google-auth-library JWT and call the Generative Language endpoint
    // Additional providers may be supported in future, but docs reflect the current Gemini-based implementation.
  }

  public async generateConversation(params: GenerationParams): Promise<Conversation> {
    const promptHash = this.computePromptHash(params);
    const cacheKey = this.buildCacheKey(params.wordId, params.generatorVersion, promptHash);

    // Check cache first
    const cachedConversation = await this.getCachedConversation(cacheKey);
    if (cachedConversation) {
      console.log(`Cache hit for conversation: ${cacheKey}`);
      return cachedConversation;
    }

    // Generate new conversation
    console.log(`Cache miss, generating new conversation: ${cacheKey}`);
    const conversation = await this.generateNewConversation(params, promptHash);

    // Store in cache
    await this.cacheConversation(cacheKey, conversation);

    return conversation;
  }

  private computePromptHash(params: GenerationParams): string {
    const prompt = params.customPrompt || this.buildDefaultPrompt(params);
    const hashInput = `${prompt}:${params.word}:${params.meaning || ""}`;

    return createHash("sha256").update(hashInput).digest("hex").substring(0, 16); // Short hash for cache keys
  }

  private buildDefaultPrompt(params: GenerationParams): string {
    return `Create a natural conversation in Mandarin Chinese that uses the word "${params.word}" ${
      params.meaning ? `(meaning: ${params.meaning})` : ""
    }. 
    
Requirements:
- Exactly 3-5 speaker turns
- Each turn should be 1-2 short sentences
- Natural, conversational tone appropriate for language learning
- Include the target word in a meaningful context
- Speakers should be labeled A and B
- Keep each turn under 50 characters for readability

Format as a natural dialogue between two people.`;
  }

  private buildCacheKey(wordId: string, generatorVersion: string, promptHash: string): string {
    return `convo/${wordId}/${generatorVersion}/${promptHash}.json`;
  }

  private async getCachedConversation(cacheKey: string): Promise<Conversation | null> {
    try {
      const file = this.storage.bucket(this.bucketName).file(cacheKey);
      const [exists] = await file.exists();

      if (!exists) {
        return null;
      }

      const [contents] = await file.download();
      const conversation = JSON.parse(contents.toString());

      // Validate cached conversation structure
      if (this.isValidConversation(conversation)) {
        return conversation;
      } else {
        console.warn(`Invalid cached conversation, removing: ${cacheKey}`);
        await file.delete().catch(() => {}); // Best effort cleanup
        return null;
      }
    } catch (error) {
      console.error(`Error reading cached conversation ${cacheKey}:`, error);
      return null;
    }
  }

  private async generateNewConversation(
    params: GenerationParams,
    promptHash: string
  ): Promise<Conversation> {
    const prompt = params.customPrompt || this.buildDefaultPrompt(params);

    try {
      const completion = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a Mandarin Chinese language teacher creating natural conversation examples for students.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const generatedText = completion.choices[0].message.content;
      const turns = this.parseConversationTurns(generatedText);

      if (turns.length < 3 || turns.length > 5) {
        throw new Error(`Generated conversation has ${turns.length} turns, expected 3-5`);
      }

      const conversation: Conversation = {
        id: `${params.wordId}-${params.generatorVersion}-${promptHash}`,
        wordId: params.wordId,
        word: params.word,
        meaning: params.meaning,
        turns,
        generatedAt: new Date().toISOString(),
        generatorVersion: params.generatorVersion,
        promptHash,
      };

      return conversation;
    } catch (error) {
      console.error("AI generation failed:", error);
      throw new Error(`Failed to generate conversation: ${error.message}`);
    }
  }

  private parseConversationTurns(text: string): ConversationTurn[] {
    const lines = text.split("\n").filter((line) => line.trim());
    const turns: ConversationTurn[] = [];

    for (const line of lines) {
      // Match patterns like "A: 你好！" or "Person A: 你好！"
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, speaker, text] = match;
        turns.push({
          speaker: speaker.trim(),
          text: text.trim(),
        });
      }
    }

    return turns;
  }

  private async cacheConversation(cacheKey: string, conversation: Conversation): Promise<void> {
    try {
      const file = this.storage.bucket(this.bucketName).file(cacheKey);

      // Use atomic write to prevent partial writes
      await file.save(JSON.stringify(conversation, null, 2), {
        metadata: {
          contentType: "application/json",
          cacheControl: "public, max-age=2592000", // 30 days
          metadata: {
            wordId: conversation.wordId,
            generatorVersion: conversation.generatorVersion,
            createdAt: conversation.generatedAt,
          },
        },
        // Prevent overwriting existing files (atomic operation)
        preconditionOpts: {
          ifGenerationMatch: 0,
        },
      });

      console.log(`Cached conversation: ${cacheKey}`);
    } catch (error) {
      if (error.code === 412) {
        // File already exists (race condition), this is fine
        console.log(`Conversation already cached: ${cacheKey}`);
      } else {
        console.error(`Failed to cache conversation ${cacheKey}:`, error);
        // Don't throw - caching failure shouldn't break generation
      }
    }
  }

  private isValidConversation(data: any): data is Conversation {
    return (
      typeof data?.id === "string" &&
      typeof data?.wordId === "string" &&
      typeof data?.word === "string" &&
      Array.isArray(data?.turns) &&
      data.turns.length >= 3 &&
      data.turns.length <= 5 &&
      data.turns.every(
        (turn: any) => typeof turn.speaker === "string" && typeof turn.text === "string"
      )
    );
  }
}
```

**Express Route Integration:**

```javascript
// local-backend/routes/generator.js
const express = require("express");
const { ConversationGenerator } = require("../services/conversationGenerator");
const router = express.Router();

const generator = new ConversationGenerator();

// Route used in current codebase (see shared constants and local-backend routes)
router.post("/conversation/text/generate", async (req, res) => {
  try {
    const { wordId, word, meaning, generatorVersion = "v1", customPrompt } = req.body;

    if (!wordId || !word) {
      return res.status(400).json({
        error: "wordId and word are required",
      });
    }

    const conversation = await generator.generateConversation({
      wordId,
      word,
      meaning,
      generatorVersion,
      customPrompt,
    });

    res.json(conversation);
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
});

// Health check with cache statistics
router.get("/generator/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "conversation-generator",
    timestamp: new Date().toISOString(),
    version: process.env.GENERATOR_VERSION || "v1",
  });
});

module.exports = router;
```

## Architecture Integration

```
API Request → Generator Service → Cache Check → [Hit: Return] → Response
                     ↓                           [Miss: ↓]
                AI Provider → Parse Response → Validate → Cache Store → Response
                     ↓
             GCS Cache Storage (30-day lifecycle)
```

The generator service acts as an intelligent cache-first system that minimizes AI API calls while ensuring fresh, contextual conversations for vocabulary learning.

## Notes / Current-Code Mapping

- Runtime behavior: the active code computes a deterministic hash from the `wordId` only (see `local-backend/utils/hashUtils.js` → `computeHash(wordId)`) and uses that as the cache identifier.
- Actual cache path used by the running code: `convo/${wordId}/${hash}.json` (text) and `convo/${wordId}/${hash}.mp3` (audio). The Vercel text handler sets `conversation.id = `${wordId}-${hash}` before caching/returning results.
- Design trade-off: using `generatorVersion + promptHash` provides automatic invalidation when prompts or generation logic mutate; using `wordId`-only hash simplifies scaffold determinism and fixture alignment but requires manual invalidation for prompt changes.
- Migration options:
  - Option A (keep current): update docs to reflect `computeHash(wordId)` behavior and rely on manual cache invalidation for prompt/behavior changes.
  - Option B (migrate): implement version-aware cache keys (`generatorVersion + promptHash`) across `hashUtils`, generator, and cache utilities, and provide a migration/cleanup plan for existing GCS objects.

Refer to `docs/issue-implementation/epic-8-conversation-generation/runtime-notes.md` for the canonical runtime id and cache path mapping used by the codebase.

## Technical Challenges & Solutions

**Challenge:** Ensuring deterministic cache behavior across deployments

```typescript
// Solution: Version-aware cache keys with prompt fingerprinting
class CacheKeyManager {
  static generateKey(params: GenerationParams): string {
    const components = [
      "convo",
      params.wordId,
      params.generatorVersion,
      this.computePromptFingerprint(params),
    ];
    return components.join("/") + ".json";
  }

  static computePromptFingerprint(params: GenerationParams): string {
    // Include all prompt-affecting parameters
    const fingerprintData = {
      prompt: params.customPrompt || "default",
      word: params.word,
      meaning: params.meaning || "",
      version: params.generatorVersion,
    };

    return createHash("sha256")
      .update(JSON.stringify(fingerprintData))
      .digest("hex")
      .substring(0, 12);
  }
}
```

**Challenge:** Handling AI service rate limits and failures

```typescript
// Solution: Retry logic with exponential backoff
async function generateWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.aiClient.generate(prompt);
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
      throw error;
    }
  }
}
```

**Challenge:** Parsing inconsistent AI-generated conversation formats

```typescript
// Solution: Robust parsing with multiple fallback strategies
class ConversationParser {
  static parseConversation(text: string): ConversationTurn[] {
    // Strategy 1: Standard format "A: text"
    let turns = this.parseStandardFormat(text);
    if (turns.length >= 3) return turns;

    // Strategy 2: Numbered format "1. A: text"
    turns = this.parseNumberedFormat(text);
    if (turns.length >= 3) return turns;

    // Strategy 3: Paragraph format with speaker detection
    turns = this.parseParagraphFormat(text);
    if (turns.length >= 3) return turns;

    throw new Error("Could not parse conversation format");
  }
}
```

## Testing Implementation

- Unit tests for cache key generation and prompt hashing
- Integration tests with mocked AI provider responses
- Cache consistency tests with concurrent requests
- Error handling tests for AI service failures
- Performance tests for cache hit/miss scenarios
