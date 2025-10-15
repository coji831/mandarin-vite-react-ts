# Epic 1: Google Cloud Text-to-Speech Integration

## Technical Overview

**Implementation Goal:** Integrate Google Cloud Text-to-Speech (TTS) API into the Mandarin vocabulary learning application with optimized caching strategies, supporting both local development and serverless deployment patterns.

**Epic Size:** Small (implemented as a single unit without separate stories)

**Status:** Completed - Merged into `main` branch

**Last Updated:** July 6, 2025

> **AI-OPTIMIZED TIP**: For business context and user stories, see [Business Requirements](../../business-requirements/epic-1-google-cloud-tts-integration-template/README.md). This document focuses on technical implementation details.

## Architecture Decisions

1. **Google Cloud TTS Selection**: Chosen for high-quality Mandarin voices and natural intonation

   - Rationale: Superior pronunciation quality specifically for Mandarin Chinese
   - Alternative considered: Amazon Polly (rejected due to less natural Mandarin pronunciation)

2. **Google Cloud Storage for Caching**: Implemented for performance and cost optimization

   - Rationale: Seamless integration with Google Cloud services and cost-effective storage pricing
   - Alternative considered: Local file storage (rejected due to scalability limitations)

3. **Hybrid Server Architecture**: Express for development, compatible with serverless functions

   - Rationale: Developer experience with hot reloading while maintaining production compatibility
   - Alternative considered: Serverless-only (rejected due to slower development iteration)

4. **MD5 Hashing for Cache Keys**: Deterministic naming for audio file lookup

   - Rationale: Consistent file naming with collision resistance for text inputs
   - Alternative considered: Custom naming scheme (rejected due to potential collisions)

5. **API-First Integration**: REST API for frontend communication
   - Rationale: Clear separation of concerns between UI and audio generation
   - Alternative considered: Direct library integration (rejected due to client-side credentials risk)

## Technical Implementation

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│                 │     │                 │     │                     │
│  React Frontend ├────►│  Express Server ├────►│  Google Cloud TTS   │
│  (PlayButton)   │     │  (API Handler)  │     │  (Audio Generation) │
│                 │     │                 │     │                     │
└────────▲────────┘     └────────┬────────┘     └─────────┬───────────┘
         │                       │                        │
         │                       │                        │
         │                       │                        ▼
         │                       │              ┌─────────────────────┐
         │                       │              │                     │
         └───────────────────────┼──────────────┤  Google Cloud       │
                                 │              │  Storage (Cache)    │
                                 └──────────────►                     │
                                                │                     │
                                                └─────────────────────┘
```

### Data Flow

1. **Request Initiation**: Frontend `PlayButton` component requests audio with specific Chinese text
2. **Cache Check**: Backend verifies if audio file exists in Google Cloud Storage using MD5 hash
3. **Conditional Generation**: If cache miss, system calls Google Cloud TTS to generate new audio
4. **Persistence**: Generated audio stored in GCS with content-based hash filename
5. **Response**: Backend returns a JSON object containing `audioUrl` that points to the cached or newly-generated audio in GCS
6. **Playback**: Frontend plays audio using standard HTML5 Audio API

### API Endpoints

```
POST /api/get-tts-audio
```

**Request Body (JSON):**

- `text` (string, required): The Mandarin text to convert to speech (1-15 words recommended)
- `voice` (string, optional): Voice identifier (e.g., "cmn-CN-Wavenet-B")

**Response:**

```json
{
  "audioUrl": "https://storage.googleapis.com/bucket-name/md5hash.mp3"
}
```

**Error Response:**

```json
{
  "error": "Error generating TTS audio: [detailed error]"
}
```

### Component Relationships

```
PlayButton.tsx ──► API Client ──► get-tts-audio.js API ──┬─► TTS Cache Check
                                                          │
FlashCard.tsx ───► Audio Playback ◄── Audio URL Response ◄┴─► TTS Generation
```

### Code Structure

```
api/
├── get-tts-audio.js           # Main API handler for TTS requests
└── utils/
    ├── cache-helpers.js       # GCS cache interaction functions
    └── audio-generation.js    # Google Cloud TTS wrapper functions
```

**Key Implementation Patterns:**

```javascript
// Cache lookup pattern
async function getAudioFromCache(text, voice) {
  const hash = md5(text + voice);
  const filename = `${hash}.mp3`;
  const file = bucket.file(filename);

  const exists = await file.exists();

  if (exists[0]) {
    return {
      url: `https://storage.googleapis.com/${bucketName}/${filename}`,
      isCached: true,
    };
  }

  return null;
}
```

## Design Decisions & Tradeoffs

**Implementation Scope:** This is a small epic that was implemented as a single unit without breaking it into separate stories.

### Why Google Cloud TTS?

- High-quality Mandarin voices with natural intonation and accurate pronunciation
- Multiple voice options to provide variety in the learning experience
- Support for Pinyin and Chinese characters to ensure proper pronunciation
- Scalable API with reasonable pricing for our expected usage volume

### Local Server vs Serverless Functions

- Local development: Express server for easy debugging and testing
- Production: Code structured to work in serverless environments

### Caching Strategy Considerations

- Why GCS?
  - Seamless integration with Google Cloud TTS
  - Cost-effective for audio storage
  - High availability and performance
- Alternative approaches considered:
  - Local file caching: Rejected due to scalability issues
  - Database storage: Rejected due to size and performance concerns
  - CDN integration: Planned for future enhancement

## Known Issues & Limitations

- Limited pronunciation customization options
- No support for fine-tuning speech parameters
- Limited voice selection
- No offline functionality for audio playback
- No analytics for tracking most requested phrases

## References

- [Google Cloud Text-to-Speech Documentation](https://cloud.google.com/text-to-speech/docs)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)

### Component Reference

Key Components

- **PlayButton**: Component for audio playback of Mandarin text
- **get-tts-audio.js**: API handler for Google Cloud TTS requests
- **FlashCard**: Enhanced with audio playback functionality

### Related Features

This provides the audio foundation for the Mandarin vocabulary learning system, connecting with the flashcard and vocabulary features in Epic 2.

### Future Considerations

- Pronunciation customization: Allow fine-tuning of speech parameters
- Support for additional voices: Expand voice options for different learning preferences
- Offline functionality: Explore options for downloading frequently used audio
- Analytics: Track most requested phrases to optimize caching strategies
