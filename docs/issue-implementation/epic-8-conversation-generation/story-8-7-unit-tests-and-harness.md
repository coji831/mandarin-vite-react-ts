# Implementation 8-7: Local Harness & Validation (CI-friendly)

## Technical Scope

- Automated test harness for conversation features validation
- CI-compatible testing without external dependencies
- Schema validation and business rule enforcement
- End-to-end workflow testing from UI to backend
- Performance and reliability testing suite

## Implementation Details

```javascript
// scripts/harness-local.js
const { spawn } = require("child_process");
const fetch = require("node-fetch");
const fs = require("fs").promises;

class ConversationHarness {
  constructor() {
    this.serverProcess = null;
    this.baseUrl = "http://localhost:3001";
    this.testResults = [];
  }

  async run() {
    console.log("🚀 Starting Conversation Feature Harness");

    try {
      await this.startServer();
      await this.runTests();
      await this.generateReport();
    } finally {
      await this.cleanup();
    }
  }

  async startServer() {
    console.log("📡 Starting local backend with conversations enabled...");

    this.serverProcess = spawn("node", ["local-backend/server.js"], {
      env: {
        ...process.env,
        USE_CONVERSATION: "true",
        NODE_ENV: "test",
      },
    });

    // Wait for server to be ready
    await this.waitForServer();
  }

  async runTests() {
    const tests = [
      this.testTextScaffolder,
      this.testAudioScaffolder,
      this.testSchemaValidation,
      this.testBusinessRules,
      this.testErrorHandling,
      this.testPerformance,
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.push({
          test: test.name,
          status: "FAIL",
          error: error.message,
        });
      }
    }
  }

  async testTextScaffolder() {
    console.log("🧪 Testing text scaffolder endpoint...");

    const response = await fetch(`${this.baseUrl}/api/scaffold/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: "test-word",
        word: "你好",
        generatorVersion: "v1",
      }),
    });

    if (!response.ok) {
      throw new Error(`Text scaffolder failed: ${response.status}`);
    }

    const conversation = await response.json();

    // Validate response structure
    this.validateConversationSchema(conversation);
    this.validateBusinessRules(conversation);

    this.testResults.push({
      test: "textScaffolder",
      status: "PASS",
      responseTime: response.headers.get("x-response-time"),
    });
  }

  async testAudioScaffolder() {
    console.log("🎵 Testing audio scaffolder endpoint...");

    const response = await fetch(`${this.baseUrl}/api/scaffold/audio/test-conversation`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Audio scaffolder failed: ${response.status}`);
    }

    const audioData = await response.json();

    // Validate audio URL is accessible
    const audioResponse = await fetch(audioData.audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Audio file not accessible: ${audioData.audioUrl}`);
    }

    this.testResults.push({
      test: "audioScaffolder",
      status: "PASS",
      audioUrl: audioData.audioUrl,
    });
  }

  validateConversationSchema(conversation) {
    const required = ["id", "wordId", "word", "turns", "generatedAt", "generatorVersion"];

    for (const field of required) {
      if (!conversation[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(conversation.turns)) {
      throw new Error("turns must be an array");
    }

    conversation.turns.forEach((turn, index) => {
      if (!turn.speaker || !turn.text) {
        throw new Error(`Invalid turn ${index}: missing speaker or text`);
      }
    });
  }

  validateBusinessRules(conversation) {
    // Rule: 3-5 turns per conversation
    if (conversation.turns.length < 3 || conversation.turns.length > 5) {
      throw new Error(`Invalid turn count: ${conversation.turns.length}, expected 3-5`);
    }

    // Rule: Reasonable text length per turn
    conversation.turns.forEach((turn, index) => {
      if (turn.text.length > 200) {
        throw new Error(`Turn ${index} too long: ${turn.text.length} chars`);
      }
    });
  }

  async testPerformance() {
    console.log("⚡ Testing performance requirements...");

    const start = Date.now();

    const response = await fetch(`${this.baseUrl}/api/scaffold/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: "perf-test",
        word: "test",
      }),
    });

    const duration = Date.now() - start;

    if (duration > 200) {
      throw new Error(`Response too slow: ${duration}ms, expected <200ms`);
    }

    this.testResults.push({
      test: "performance",
      status: "PASS",
      responseTime: duration,
    });
  }

  async generateReport() {
    const passed = this.testResults.filter((r) => r.status === "PASS").length;
    const failed = this.testResults.filter((r) => r.status === "FAIL").length;

    console.log("\n📊 Test Results Summary:");
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\n🔍 Failures:");
      this.testResults
        .filter((r) => r.status === "FAIL")
        .forEach((result) => {
          console.log(`  - ${result.test}: ${result.error}`);
        });
      process.exit(1);
    }

    console.log("\n🎉 All tests passed!");
  }

  async cleanup() {
    if (this.serverProcess) {
      this.serverProcess.kill("SIGTERM");
    }
  }
}

// Run harness if called directly
if (require.main === module) {
  const harness = new ConversationHarness();
  harness.run().catch((error) => {
    console.error("Harness failed:", error);
    process.exit(1);
  });
}

module.exports = ConversationHarness;
```

## Architecture Integration

```
CI Pipeline → Harness Start → Server Launch → Test Suite → Validation → Report → Cleanup
                                   ↓
                           Scaffolder Endpoints → Schema Validation → Business Rules
```

## Technical Challenges & Solutions

**Challenge:** Running tests without external dependencies

```javascript
// Solution: Environment detection and mock switching
const testMode = process.env.NODE_ENV === "test";
const endpoints = testMode ? "scaffolder" : "production";
```

**Challenge:** Reliable server startup detection

```javascript
// Solution: Health check polling with timeout
async waitForServer(timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await fetch(`${this.baseUrl}/health`);
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error('Server failed to start');
}
```

## Testing Implementation

- Comprehensive test coverage for all conversation endpoints
- Schema validation for all response formats
- Business rule enforcement testing
- Performance benchmarking with SLA validation
- CI integration with GitHub Actions
