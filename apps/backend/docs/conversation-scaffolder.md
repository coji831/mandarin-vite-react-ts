# Conversation Scaffold Mode

## Purpose

Provides deterministic fixture data for UI development, testing, and CI validation without requiring live Google Cloud APIs.

## Environment Toggle

Set `CONVERSATION_MODE="scaffold"` in `.env.local` to enable scaffold mode.

## Endpoints

Scaffold mode intercepts the same endpoints as real mode:

### POST /api/mandarin/conversation/text/generate

**Request:** `{ wordId: string, word?: string }`

**Response:** Returns deterministic conversation JSON from `public/data/examples/conversations/`

```json
{
  "id": "word-123-fixture",
  "wordId": "word-123",
  "word": "你好",
  "turns": [
    { "speaker": "A", "text": "你好，今天天气真好。" },
    { "speaker": "B", "text": "是的，我们去公园走走吧。" }
  ],
  "_metadata": {
    "mode": "scaffold",
    "processedAt": "2025-11-16T12:00:00.000Z"
  }
}
```

### POST /api/mandarin/conversation/audio/generate

**Request:** `{ wordId: string, voice?: string }`

**Response:** Returns URL to pre-generated fixture audio file

```json
{
  "conversationId": "word-123-fixture",
  "audioUrl": "/data/examples/conversations/audio/word-123.mp3",
  "voice": "cmn-CN-Wavenet-B",
  "cached": true
}
```

## Implementation

Scaffold routes are configured in `controllers/scaffoldController.js`:

```js
export function configureScaffoldRoutes(app) {
  if (config.conversationMode !== "scaffold") {
    return; // Skip if not in scaffold mode
  }

  // Serve static data files
  app.use("/data", express.static(path.join(__dirname, "..", "..", "public", "data")));

  // Scaffold endpoints
  app.post(ROUTE_PATTERNS.conversationTextGenerate, ...);
  app.post(ROUTE_PATTERNS.conversationAudioGenerate, ...);
}
```

## Fixture Data Location

- **Text fixtures:** `public/data/examples/conversations/*.json`
- **Audio fixtures:** `public/data/examples/conversations/audio/*.mp3`
- **Vocabulary data:** `public/data/vocabulary/*.csv`

## Static File Serving

Scaffold mode serves public data directory:

```
GET /data/vocabulary/HSK1.csv
GET /data/examples/conversations/audio/word-123.mp3
```

CORS headers are automatically added for audio files.

## Usage

### Development Workflow

1. Set `CONVERSATION_MODE=scaffold` in `.env.local`
2. Start server: `npm run start-backend`
3. Frontend calls same API endpoints
4. Receives deterministic fixtures instead of live API calls

### Benefits

- **No API keys required**: No Google Cloud credentials needed
- **Fast iteration**: No network latency or API quotas
- **Deterministic**: Same input always returns same output
- **CI/CD friendly**: Tests run without external dependencies

### Switching to Real Mode

1. Set `CONVERSATION_MODE=real` in `.env.local`
2. Add required Google Cloud credentials (see README.md)
3. Restart server
4. Same API endpoints now hit live Google Cloud APIs

## Fixture Generation

To add new fixtures:

1. Create JSON file in `public/data/examples/conversations/`
2. Name using pattern: `{wordId}.json` or descriptive name
3. Follow conversation object schema (see api-spec.md)
4. (Optional) Add corresponding audio file to `audio/` subdirectory

See `utils/scaffoldUtils.js` for fixture loading logic.
