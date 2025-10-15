// scripts/harness-local.js
// Local harness for conversation backend validation (Story 8.7)
// Runs offline, validates endpoints, and checks fixture schema

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_PORT = 3001;
const BASE_URL = `http://localhost:${BACKEND_PORT}/api`;
const FIXTURES_DIR = path.resolve(__dirname, "../public/data/examples/conversations/fixtures");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function startBackend() {
  // Start local-backend with CONVERSATION_MODE=scaffold
  return spawn("node", ["local-backend/server.js"], {
    env: { ...process.env, CONVERSATION_MODE: "scaffold" },
    stdio: "inherit",
  });
}

async function waitForBackend() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/conversation/health`);
      if (res.ok) {
        const data = await res.json();
        // healthcheck returns the configured mode; accept 'scaffold' as enabled
        if (data.mode === "scaffold" || data.mode === "scaffold") return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Backend did not start in time or health check failed");
}

async function validateFixtures() {
  const files = fs.readdirSync(FIXTURES_DIR);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), "utf-8"));
    if (Array.isArray(data.turns)) {
      // Conversation fixture
      assert(
        data.turns.length >= 3 && data.turns.length <= 5,
        `Fixture ${file} has invalid turn count`
      );
      // Fixture may use `id` or `conversationId` depending on source
      assert(
        typeof data.id === "string" || typeof data.conversationId === "string",
        `Fixture ${file} missing id or conversationId`
      );
      assert(typeof data.generatedAt === "string", `Fixture ${file} missing generatedAt`);
    } else if (Array.isArray(data.timeline)) {
      // Audio fixture
      assert(
        typeof data.conversationId === "string" || typeof data.id === "string",
        `Audio fixture ${file} missing conversationId or id`
      );
      assert(typeof data.audioUrl === "string", `Audio fixture ${file} missing audioUrl`);
      assert(typeof data.generatedAt === "string", `Audio fixture ${file} missing generatedAt`);
      // timeline should be array of marks
      assert(
        data.timeline.every((t) => typeof t.mark === "string" && typeof t.timeSeconds === "number"),
        `Audio fixture ${file} has invalid timeline marks`
      );
    } else {
      throw new Error(`Fixture ${file} is not a valid conversation or audio fixture`);
    }
  }
  console.log("All fixtures passed schema validation");
}

async function testConversationEndpoint() {
  // Use POST /conversation/text/generate to match runtime router mounted under /api
  const res = await fetch(`${BASE_URL}/conversation/text/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordId: "test", word: "测试", generatorVersion: "v1" }),
  });
  assert(res.ok, "Conversation endpoint failed");
  const data = await res.json();
  assert(Array.isArray(data.turns), "Conversation response missing turns");
  assert(
    data.turns.length >= 3 && data.turns.length <= 5,
    "Conversation response has invalid turn count"
  );
  console.log("Conversation endpoint passed");
}

async function testAudioEndpoint() {
  // Request audio generation via POST /conversation/audio/generate
  const res = await fetch(`${BASE_URL}/conversation/audio/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordId: "test", voice: "cmn-CN-Standard-A", bitrate: 128 }),
  });
  assert(res.ok, "Audio endpoint failed");
  const data = await res.json();
  assert(
    typeof data.audioUrl === "string" &&
      (data.audioUrl.startsWith("http") || data.audioUrl.startsWith("/")),
    "Audio endpoint returned invalid URL"
  );
  // If audioUrl is relative, convert to absolute for validation
  const audioUrl = data.audioUrl.startsWith("/")
    ? `http://localhost:${BACKEND_PORT}${data.audioUrl}`
    : data.audioUrl;
  const audioResponse = await fetch(audioUrl);
  assert(audioResponse.ok, `Audio file not accessible: ${audioUrl}`);
  console.log("Audio endpoint passed");
}

async function runHarness() {
  console.log("Starting local-backend...");
  const backend = await startBackend();
  try {
    await waitForBackend();
    await validateFixtures();
    await testConversationEndpoint();
    await testAudioEndpoint();
    console.log("All tests passed!");
  } catch (err) {
    console.error("Harness failed:", err);
    process.exit(1);
  } finally {
    backend.kill();
    console.log("Backend stopped.");
  }
}

runHarness();
