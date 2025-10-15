# Implementation 8-3: Scaffolder — Audio endpoint (deterministic)

## Technical Scope

- Express.js audio scaffolder endpoint returning deterministic audio metadata
- Static audio file serving with timeline metadata
- Sample audio artifacts under 1MB for repository storage
- HTTP response format matching production TTS API
- Timeline generation for turn-by-turn highlighting support

## Implementation Details

```javascript
// local-backend/routes/audio.js
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// Scaffold mode is controlled by CONVERSATION_MODE set to "scaffold"
const CONVERSATION_MODE = process.env.CONVERSATION_MODE || "real";

if (CONVERSATION_MODE !== "scaffold") {
  module.exports = router;
  return;
}

// Audio artifacts and metadata
const AUDIO_FIXTURES_PATH = path.join(process.cwd(), "public/data/examples/conversations/audio");
const audioMetadataCache = new Map();

// Predefined timeline metadata for sample audio files
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

async function getAudioMetadata(conversationId) {
  if (audioMetadataCache.has(conversationId)) {
    return audioMetadataCache.get(conversationId);
  }

  // Extract word from conversation ID for fixture selection
  const wordId = conversationId.split("-")[0];
  const audioFileName = `${wordId}-basic.mp3`;
  const timelineKey = `${wordId}-basic`;

  // Check if specific audio file exists, fallback to default
  const audioPath = path.join(AUDIO_FIXTURES_PATH, audioFileName);
  let audioUrl, durationSeconds, timeline;

  try {
    await fs.access(audioPath);
    audioUrl = `/data/examples/conversations/audio/${audioFileName}`;
    timeline = SAMPLE_TIMELINES[timelineKey] || SAMPLE_TIMELINES.default;
    durationSeconds = timeline[timeline.length - 1].timeSeconds + 2.0; // Estimated
  } catch (err) {
    // Fallback to default audio
    audioUrl = "/data/examples/conversations/audio/default-conversation.mp3";
    timeline = SAMPLE_TIMELINES.default;
    durationSeconds = 6.0;
  }

  const metadata = {
    audioUrl,
    conversationId,
    timeline,
    durationSeconds,
    generatedAt: new Date().toISOString(),
    voice: "cmn-CN-Standard-A", // Default Mandarin voice
    bitrate: 128,
  };

  audioMetadataCache.set(conversationId, metadata);
  return metadata;
}

// GET endpoint for simple audio requests
router.get("/audio/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { voice = "cmn-CN-Standard-A", bitrate = 128 } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        error: "conversationId parameter is required",
      });
    }

    const audioMetadata = await getAudioMetadata(conversationId);

    // Customize metadata based on request parameters
    const response = {
      ...audioMetadata,
      voice,
      bitrate: parseInt(bitrate, 10),
    };

    // Simulate realistic response time for audio processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    res.json(response);
  } catch (error) {
    console.error("Audio scaffolder error:", error);
    res.status(500).json({
      error: "Failed to get audio metadata",
      message: error.message,
    });
  }
});

// POST endpoint matching production TTS API
// Current implementation exposes the audio generate endpoint at:
// POST /api/conversation/audio/generate (router path: /conversation/audio/generate)
router.post("/conversation/audio/generate", async (req, res) => {
  try {
    const { conversationId, voice = "cmn-CN-Standard-A", bitrate = 128 } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        error: "conversationId is required in request body",
      });
    }

    const audioMetadata = await getAudioMetadata(conversationId);

    const response = {
      ...audioMetadata,
      voice,
      bitrate,
      // Add cache simulation
      cached: Math.random() > 0.3, // 70% "cache hit" rate for testing
      processingTimeMs: Math.floor(Math.random() * 200) + 50,
    };

    res.json(response);
  } catch (error) {
    console.error("Audio scaffolder error:", error);
    res.status(500).json({
      error: "Failed to generate audio",
      message: error.message,
    });
  }
});

// Endpoint to validate audio file accessibility
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
    res.status(404).json({
      exists: false,
      error: "Audio file not found",
    });
  }
});

module.exports = router;
```

**Static Audio File Setup:**

```javascript
// local-backend/server.js - Static file serving
const express = require("express");
const path = require("path");

// Serve static audio files
app.use("/data", express.static(path.join(__dirname, "..", "public", "data")));

// Enable CORS for audio files
app.use("/data/examples/conversations/audio/*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Range");
  res.header("Access-Control-Expose-Headers", "Content-Range, Content-Length");
  next();
});
```

**Frontend Integration:**

```typescript
// src/features/conversation/services/audioApi.ts
export async function requestAudio(params: {
  conversationId: string;
  voice?: string;
  bitrate?: number;
}): Promise<ConversationAudio> {
  // Frontend uses /api/conversation/audio/generate for both dev and prod in the current codebase
  const endpoint = "/conversation/audio/generate";

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Audio generation failed: ${response.statusText}`);
  }

  const audioData = await response.json();

  // Validate audio URL is accessible
  await validateAudioUrl(audioData.audioUrl);

  return audioData;
}

async function validateAudioUrl(url: string): Promise<void> {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`Audio file not accessible: ${url}`);
  }
}
```

## Architecture Integration

```
Audio Request → Scaffolder → Metadata Lookup → File Validation → Timeline Generation → Response
                     ↓
Static File Server → Direct audio serving with proper headers
                     ↓
Frontend Audio Player → Uses timeline for synchronized highlighting
```

The scaffolder provides realistic audio responses with proper timeline metadata, enabling full testing of audio playback features without external TTS dependencies.

## Technical Challenges & Solutions

**Challenge:** Creating realistic timeline metadata for turn synchronization

```javascript
// Solution: Hand-crafted timeline data based on actual speech patterns
function generateRealisticTimeline(turns) {
  const avgWordsPerSecond = 2.5; // Realistic Mandarin speech rate
  let currentTime = 0;

  return turns.map((turn, index) => {
    const wordCount = turn.text.length / 2; // Approximate for Mandarin
    const duration = wordCount / avgWordsPerSecond;
    const mark = `turn-${index + 1}`;
    const timeSeconds = currentTime;

    currentTime += duration + 0.5; // Add pause between turns

    return { mark, timeSeconds };
  });
}
```

**Challenge:** Serving audio files efficiently in development

```javascript
// Solution: Optimized static file serving with proper headers
app.use(
  "/data/examples/conversations/audio",
  express.static(audioPath, {
    maxAge: "1h",
    etag: true,
    lastModified: true,
    acceptRanges: true, // Enable audio seeking
  })
);
```

**Challenge:** Keeping audio file sizes minimal for repository storage

```bash
# Solution: Optimized audio compression pipeline
# Generate sample audio files with optimal settings
ffmpeg -i input.wav -codec:a mp3 -b:a 64k -ar 22050 -ac 1 output.mp3

# Result: ~30-60KB files for 6-10 second conversations
```

## Testing Implementation

- Unit tests for metadata generation and caching logic
- Integration tests validating audio URL accessibility
- Performance tests ensuring audio files load within 200ms
- Timeline accuracy tests for turn synchronization
- Cross-browser compatibility tests for audio playback
