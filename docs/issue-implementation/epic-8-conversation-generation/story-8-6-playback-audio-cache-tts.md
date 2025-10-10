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
    this.bucketName = process.env.AUDIO_CACHE_BUCKET || "mandarin-audio";
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
