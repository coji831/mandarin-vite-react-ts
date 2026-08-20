# Implementation 8-6: Playback Integration — audio cache & on-demand TTS

## Technical Scope

- Google Cloud TTS integration with on-demand generation
- GCS audio caching with atomic write operations
- Timeline metadata generation for turn-by-turn highlighting
- Cost control measures and rate limiting
- Integration with conversation text from generator

## Implementation Details

```typescript
// local-backend/services/audioGenerator.ts
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { Storage } from "@google-cloud/storage";

export class AudioGenerator {
  private ttsClient: TextToSpeechClient;
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.ttsClient = new TextToSpeechClient();
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || "mandarin-audio";
  }

  async generateAudio(params: {
    conversationId: string;
    turns: ConversationTurn[];
    voice?: string;
    bitrate?: number;
  }): Promise<ConversationAudio> {
    const cacheKey = this.buildAudioCacheKey(params);

    // Check cache first
    const cached = await this.getCachedAudio(cacheKey);
    if (cached) return cached;

    // Generate new audio
    const audio = await this.synthesizeAudio(params);
    await this.cacheAudio(cacheKey, audio);

    return audio;
  }

  private async synthesizeAudio(params): Promise<ConversationAudio> {
    const ssmlText = this.buildSSML(params.turns);

    const [response] = await this.ttsClient.synthesizeSpeech({
      input: { ssml: ssmlText },
      voice: {
        languageCode: "cmn-CN",
        name: params.voice || "cmn-CN-Standard-A",
      },
      audioConfig: {
        audioEncoding: "MP3",
        sampleRateHertz: 22050,
      },
    });

    const audioBuffer = response.audioContent;
    const timeline = this.extractTimeline(ssmlText);

    return {
      conversationId: params.conversationId,
      audioUrl: await this.uploadAudio(cacheKey, audioBuffer),
      timeline,
      generatedAt: new Date().toISOString(),
      voice: params.voice,
    };
  }

  private buildSSML(turns: ConversationTurn[]): string {
    let ssml = "<speak>";

    turns.forEach((turn, index) => {
      ssml += `<mark name="turn-${index + 1}"/>`;
      ssml += `<break time="0.5s"/>`;
      ssml += turn.text;
      if (index < turns.length - 1) {
        ssml += `<break time="1s"/>`;
      }
    });

    ssml += "</speak>";
    return ssml;
  }
}
```

## Architecture Integration

```
Audio Request → Cache Check → [Hit: Return URL]
                     ↓        [Miss: ↓]
               TTS Generation → SSML Building → Timeline Extraction → GCS Upload → Response
```

## Technical Challenges & Solutions

**Challenge:** Atomic audio generation to prevent race conditions

```typescript
// Solution: GCS preconditions for atomic writes
await file.save(audioBuffer, {
  preconditionOpts: { ifGenerationMatch: 0 },
});
```

**Challenge:** Extracting precise timeline from TTS marks

```typescript
// Solution: SSML mark parsing with estimated timing
private extractTimeline(ssml: string): AudioTimeline[] {
  const marks = ssml.match(/<mark name="([^"]+)"/g) || [];
  return marks.map((mark, index) => ({
    mark: mark.match(/name="([^"]+)"/)[1],
    timeSeconds: index * 2.5 // Estimated based on speech rate
  }));
}
```

## Testing Implementation

- Mock TTS client for unit tests
- Audio cache consistency tests
- Timeline accuracy validation
- Cost monitoring simulation tests

## Notes / Current-Code Mapping

- Runtime endpoint: `POST /api/conversation/audio/generate` accepts `{ wordId, voice?, bitrate?, format? }` and returns `{ conversationId, audioUrl, voice, bitrate, isCached, generatedAt }`.
  -- TTS usage in code: Google Cloud Text-to-Speech via `TextToSpeechClient.synthesizeSpeech` is called with plain text input (`input: { text: ... }`) in the current Vercel and local-backend implementations.
  - Recommended environment variables:
    - `GCS_BUCKET_NAME` (required for caching): Google Cloud Storage bucket used for cache
    - `GOOGLE_TTS_CREDENTIALS_RAW` (recommended): stringified service account JSON used by the TTS client
  - Optional local fallback: `GOOGLE_APPLICATION_CREDENTIALS` may point to a service account JSON file path for local setups, but using the `*_RAW` env vars keeps parity with Vercel.
- Cache paths: audio files are stored under `convo/${wordId}/${hash}.mp3` where `hash = computeHash(wordId)`. The runtime checks this path before generating new audio.
- Timeline behavior: current production code extracts plain text from the conversation and generates audio from that text. The SSML mark-based approach in this doc is an implementation sketch; switching production code to insert SSML `<mark>` annotations and parse timing would enable accurate per-turn timing for highlighting.

Recommendations:

- Consider migrating the production TTS synthesis to SSML marks when precise timeline synchronization is required by the UI.
- Use GCS preconditions on audio writes if you need stricter atomic guarantees during concurrent writes.
