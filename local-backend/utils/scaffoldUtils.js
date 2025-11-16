// Scaffold utilities for conversation and audio fixtures
import path from "path";
import { promises as fs } from "fs";
import { shortHash } from "./hashUtils.js";

// Fixture loading with caching
const fixtureCache = new Map();
const audioMetadataCache = new Map();

// Paths
const FIXTURES_PATH = path.join(process.cwd(), "public/data/examples/conversations/fixtures");
const AUDIO_FIXTURES_PATH = path.join(process.cwd(), "public/data/examples/conversations/audio");

// Audio timeline constants
const SAMPLE_TIMELINES = {
  "hello-basic": [
    { mark: "turn-1", timeSeconds: 0.0 },
    { mark: "turn-2", timeSeconds: 2.1 },
    { mark: "turn-3", timeSeconds: 4.8 },
  ],
  "goodbye-basic": [
    { mark: "turn-1", timeSeconds: 0.0 },
    { mark: "turn-2", timeSeconds: 1.9 },
    { mark: "turn-3", timeSeconds: 3.7 },
  ],
  default: [
    { mark: "turn-1", timeSeconds: 0.0 },
    { mark: "turn-2", timeSeconds: 2.0 },
    { mark: "turn-3", timeSeconds: 4.0 },
  ],
};

// Helper functions

function enforceTurns(turns) {
  if (!Array.isArray(turns)) return [];
  if (turns.length < 3) {
    // Repeat last turn to reach 3
    const last = turns[turns.length - 1] || {};
    while (turns.length < 3) turns.push({ ...last });
  }
  if (turns.length > 5) {
    return turns.slice(0, 5);
  }
  return turns;
}

// Conversation scaffold functions
async function loadFixture(wordId, generatorVersion = "v1") {
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
    const turns = enforceTurns(fixture.turns);
    const id = `${wordId}-${shortHash(wordId)}`;

    const customized = {
      ...fixture,
      id,
      wordId,
      word: wordId,
      turns,
      generatedAt: new Date().toISOString(),
      generatorVersion,
    };

    fixtureCache.set(wordId, customized);
    return customized;
  } catch (error) {
    throw new Error(`Failed to load fixture for wordId: ${wordId}`);
  }
}

// Audio scaffold functions
async function getScaffoldAudioMetadata(conversationId, format = "url") {
  console.log(`[Audio] Scaffold mode: requesting audio for ${conversationId}`);
  if (audioMetadataCache.has(conversationId) && format === "url") {
    return audioMetadataCache.get(conversationId);
  }

  // Force always use hello-basic.mp3 and timeline
  const audioFileName = `hello-basic.mp3`;
  const timelineKey = `hello-basic`;

  const audioPath = path.join(AUDIO_FIXTURES_PATH, audioFileName);
  let audioUrl, durationSeconds, timeline, base64Audio;

  try {
    await fs.access(audioPath);
    audioUrl = `/data/examples/conversations/audio/${audioFileName}`;
    timeline = SAMPLE_TIMELINES[timelineKey] || SAMPLE_TIMELINES.default;
    durationSeconds = timeline[timeline.length - 1].timeSeconds + 2.0;
    if (format === "base64") {
      const audioBuffer = await fs.readFile(audioPath);
      base64Audio = audioBuffer.toString("base64");
    }
  } catch (err) {
    audioUrl = "/data/examples/conversations/audio/default-conversation.mp3";
    timeline = SAMPLE_TIMELINES.default;
    durationSeconds = 6.0;
    if (format === "base64") {
      try {
        const fallbackPath = path.join(AUDIO_FIXTURES_PATH, "default-conversation.mp3");
        const audioBuffer = await fs.readFile(fallbackPath);
        base64Audio = audioBuffer.toString("base64");
      } catch (e) {
        base64Audio = "";
      }
    }
  }

  const metadata = {
    audioUrl,
    conversationId,
    timeline,
    durationSeconds,
    generatedAt: new Date().toISOString(),
    voice: "cmn-CN-Standard-A",
    bitrate: 128,
  };
  if (format === "base64") {
    metadata.base64Audio = base64Audio;
  }

  if (format === "url") {
    audioMetadataCache.set(conversationId, metadata);
  }
  return metadata;
}

async function validateScaffoldAudio(filename) {
  const audioPath = path.join(AUDIO_FIXTURES_PATH, filename);
  await fs.access(audioPath);
  const stats = await fs.stat(audioPath);
  return {
    exists: true,
    sizeBytes: stats.size,
    accessible: true,
    path: `/data/examples/conversations/audio/${filename}`,
  };
}

/**
 * Handle scaffold mode conversation with fixtures
 * @param {string} wordId - Word identifier
 * @param {string} word - Word text
 * @param {string} generatorVersion - Generator version
 * @returns {Promise<Object>} Scaffold conversation
 */
export async function handleGetScaffoldText(wordId, word, generatorVersion) {
  const { loadFixture, enforceTurns, shortHash } = await import("./scaffoldUtils.js");

  console.log(`[ScaffoldUtils] Scaffold mode: loading fixture for ${wordId}`);

  let conversation = await loadFixture(wordId, generatorVersion);

  // Override with request parameters
  conversation = {
    ...conversation,
    wordId,
    word: word || wordId,
    generatorVersion,
    generatedAt: new Date().toISOString(),
  };

  // Ensure turns is 3-5
  conversation.turns = enforceTurns(conversation.turns);

  // Ensure id pattern
  conversation.id = `${wordId}-${shortHash(wordId)}`;

  // Simulate network delay for realistic testing
  await new Promise((resolve) => setTimeout(resolve, 50));

  return conversation;
}

export {
  loadFixture,
  getScaffoldAudioMetadata,
  validateScaffoldAudio,
  shortHash,
  enforceTurns,
  SAMPLE_TIMELINES,
  FIXTURES_PATH,
  AUDIO_FIXTURES_PATH,
};
