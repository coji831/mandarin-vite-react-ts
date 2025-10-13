# Implementation 8-2: Scaffolder — Text endpoint

## Technical Scope

- Express.js route in local-backend for deterministic conversation responses
- Environment variable gating for development-only activation
- Fixture loading and response formatting
- Error handling and HTTP status codes
- API specification matching production format exactly

## Implementation Details

```javascript
// local-backend/routes/conversation.js
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// Environment gate - only active when explicitly enabled
const CONVERSATION_ENABLED = process.env.USE_CONVERSATION === "true";

if (!CONVERSATION_ENABLED) {
  console.log("Conversation scaffolder disabled. Set USE_CONVERSATION=true to enable.");
  module.exports = router;
  return;
}

// Fixture loading with caching
const fixtureCache = new Map();
const FIXTURES_PATH = path.join(process.cwd(), "public/data/examples/conversations/fixtures");

async function loadFixture(wordId) {
  if (fixtureCache.has(wordId)) {
    return fixtureCache.get(wordId);
  }

  try {
    // Try specific fixture first, fall back to default
    const fixtureFile = `${wordId}-basic.json`;
    const fixturePath = path.join(FIXTURES_PATH, fixtureFile);

    let data;
    try {
      data = await fs.readFile(fixturePath, "utf8");
    } catch (err) {
      // Fallback to generic hello fixture
      const fallbackPath = path.join(FIXTURES_PATH, "hello-basic.json");
      data = await fs.readFile(fallbackPath, "utf8");
    }

    const fixture = JSON.parse(data);

    // Customize fixture for requested word
    const customized = {
      ...fixture,
      id: `${wordId}-v1-scaffold`,
      wordId: wordId,
      word: wordId, // In real implementation, would lookup actual word
      generatedAt: new Date().toISOString(),
    };

    fixtureCache.set(wordId, customized);
    return customized;
  } catch (error) {
    throw new Error(`Failed to load fixture for wordId: ${wordId}`);
  }
}

// GET endpoint for simple requests
router.get("/conversation", async (req, res) => {
  try {
    const { wordId } = req.query;

    if (!wordId) {
      return res.status(400).json({
        error: "wordId parameter is required",
      });
    }

    const conversation = await loadFixture(wordId);

    // Simulate network delay for realistic testing
    await new Promise((resolve) => setTimeout(resolve, 50));

    res.json(conversation);
  } catch (error) {
    console.error("Scaffolder error:", error);
    res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
});

// POST endpoint matching production API
router.post("/conversation", async (req, res) => {
  try {
    const { wordId, word, generatorVersion = "v1" } = req.body;

    if (!wordId) {
      return res.status(400).json({
        error: "wordId is required in request body",
      });
    }

    const conversation = await loadFixture(wordId);

    // Override with request parameters
    const response = {
      ...conversation,
      wordId,
      word: word || wordId,
      generatorVersion,
      generatedAt: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Scaffolder error:", error);
    res.status(500).json({
      error: "Failed to generate conversation",
      message: error.message,
    });
  }
});

// Health check endpoint
router.get("/conversation/health", (req, res) => {
  res.json({
    status: "ok",
    service: "conversation-scaffolder",
    enabled: CONVERSATION_ENABLED,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

**Integration with Express App:**

```javascript
// local-backend/server.js
const conversationRoutes = require("./routes/conversation");

// Register conversation routes
app.use("/api", conversationRoutes);

console.log(
  "Local backend started with conversation scaffolder:",
  process.env.USE_CONVERSATION === "true" ? "ENABLED" : "DISABLED"
);
```

**Frontend Integration:**

```typescript
// src/features/conversation/services/conversationApi.ts
const API_BASE = process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "/api";

export async function generateConversation(params: {
  wordId: string;
  word?: string;
  generatorVersion?: string;
}): Promise<Conversation> {
  // Current frontend uses /api/conversation/text/generate for both development and production
  const endpoint = "/conversation/text/generate";

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Conversation generation failed: ${response.statusText}`);
  }

  return response.json();
}
```

## Architecture Integration

```
Frontend Request → Environment Detection → [Dev: Scaffolder] → Fixture Loading → Response
                                       → [Prod: Real Generator] → AI Service → Cache → Response
```

The scaffolder provides identical API surface to production generator, enabling seamless switching between development and production modes without frontend code changes.

## Technical Challenges & Solutions

**Challenge:** Maintaining API compatibility between scaffolder and production

```javascript
// Solution: Shared API specification validation
const apiSpec = require("../shared/conversation-api-spec.json");

function validateResponse(response) {
  // Validate response matches OpenAPI spec
  return ajv.validate(apiSpec.components.schemas.ConversationResponse, response);
}
```

**Challenge:** Providing realistic variety in scaffolded responses

```javascript
// Solution: Template-based fixture generation with randomization
function generateVariation(baseFixture, wordId) {
  const variations = ["greeting", "shopping", "restaurant", "travel"];
  const context = variations[hashCode(wordId) % variations.length];

  return {
    ...baseFixture,
    context,
    turns: generateContextualTurns(baseFixture.word, context),
  };
}
```

**Challenge:** Performance with large fixture sets

```javascript
// Solution: Lazy loading and caching
class FixtureManager {
  constructor() {
    this.cache = new LRUCache({ max: 100 });
  }

  async getFixture(wordId) {
    if (this.cache.has(wordId)) {
      return this.cache.get(wordId);
    }

    const fixture = await this.loadFromDisk(wordId);
    this.cache.set(wordId, fixture);
    return fixture;
  }
}
```

## Testing Implementation

- Unit tests for fixture loading and caching logic
- API contract tests ensuring scaffolder matches production spec
- Performance tests for response times under 100ms
- Integration tests with frontend conversation components
- Error handling tests for missing fixtures and malformed requests
