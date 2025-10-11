import express from "express";
import path from "path";
import { promises as fs } from "fs";
const router = express.Router();

const CONVERSATION_ENABLED = process.env.USE_CONVERSATION === "true";

if (!CONVERSATION_ENABLED) {
  // Just log, don't export router
}

const AUDIO_FIXTURES_PATH = path.join(process.cwd(), "public/data/examples/conversations/audio");
const audioMetadataCache = new Map();

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

async function getAudioMetadata(conversationId, format = "url") {
  if (audioMetadataCache.has(conversationId) && format === "url") {
    return audioMetadataCache.get(conversationId);
  }

  // Force always use hello-basic.mp3 and timeline
  // const wordId = conversationId.split("-")[0];
  // const audioFileName = `${wordId}-basic.mp3`;
  // const timelineKey = `${wordId}-basic`;
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

router.get("/audio/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { voice = "cmn-CN-Standard-A", bitrate = 128, format = "url" } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId parameter is required" });
    }

    const audioMetadata = await getAudioMetadata(conversationId, format);
    const response = { ...audioMetadata, voice, bitrate: parseInt(bitrate, 10) };
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.json(response);
  } catch (error) {
    console.error("Audio scaffolder error:", error);
    res.status(500).json({ error: "Failed to get audio metadata", message: error.message });
  }
});

router.post("/audio/request", async (req, res) => {
  try {
    const { conversationId, voice = "cmn-CN-Standard-A", bitrate = 128, format = "url" } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required in request body" });
    }
    const audioMetadata = await getAudioMetadata(conversationId, format);
    const response = {
      ...audioMetadata,
      voice,
      bitrate,
      cached: Math.random() > 0.3,
      processingTimeMs: Math.floor(Math.random() * 200) + 50,
    };
    res.json(response);
  } catch (error) {
    console.error("Audio scaffolder error:", error);
    res.status(500).json({ error: "Failed to generate audio", message: error.message });
  }
});

router.get("/audio/validate/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(AUDIO_FIXTURES_PATH, filename);
    await fs.access(audioPath);
    const stats = await fs.stat(audioPath);
    res.json({
      exists: true,
      sizeBytes: stats.size,
      accessible: true,
      path: `/data/examples/conversations/audio/${filename}`,
    });
  } catch (error) {
    res.status(404).json({ exists: false, error: "Audio file not found" });
  }
});

export default router;
