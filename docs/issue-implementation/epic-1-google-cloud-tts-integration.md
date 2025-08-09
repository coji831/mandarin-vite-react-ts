# Epic 1: Google Cloud Text-to-Speech Integration

## Overview

This document details the integration of Google Cloud Text-to-Speech (TTS) API into the PinyinPal application, including implementation decisions, caching strategies, and technical considerations.

**GitHub Issue:** [#7 - Implement Google Cloud Text-to-Speech Integration for Mandarin Vocabulary Learning](./007-google-cloud-tts-integration-issue.md)

**Related Epics:** [Epic 2: Integrate New Vocabulary Learning User Flow into Existing System](./epic-2-vocabulary-learning-flow.md)

## Implementation Timeline

| Date         | Milestone                                                            |
| ------------ | -------------------------------------------------------------------- |
| July 5, 2025 | Initial integration of Google Cloud TTS API and local backend server |
| July 5, 2025 | Refactoring of TTS code to use ES Module syntax                      |
| July 6, 2025 | Implementation of GCS caching for TTS audio                          |

## Technical Implementation

### Architecture

The Text-to-Speech functionality follows a client-server architecture:

1. **Frontend**: React components request audio generation via API calls
2. **Local Backend**: Express server handles API requests and communicates with Google Cloud
3. **Caching Layer**: Google Cloud Storage (GCS) stores generated audio for reuse

### API Endpoint

```
GET /api/get-tts-audio
```

**Parameters:**

- `text` (string): The Mandarin text to convert to speech
- `voice` (optional): The voice type to use (defaults to standard Mandarin female voice)

**Response:**

- JSON object with audio URL or base64-encoded audio data

### Caching Strategy

To optimize performance and reduce API costs, audio files are cached using the following approach:

1. Text is hashed using MD5 to create a unique filename
2. System checks if the audio file exists in GCS
3. If found (cache hit), the audio URL is returned directly
4. If not found (cache miss), new audio is generated, stored in GCS, then returned

## Implementation Details

### Backend Changes

1. Added dependencies:

   - `@google-cloud/text-to-speech`
   - `@google-cloud/storage`
   - `dotenv`
   - `express`
   - Hashing libraries for cache key generation

2. Created API handler in `get-tts-audio.js` with:
   - Authentication with Google Cloud
   - Text-to-speech conversion
   - Error handling
   - Cache logic

### Frontend Changes

1. Updated components:

   - `PlayButton.tsx`: Modified to fetch audio from the API
   - `FlashCard.component`: Enhanced with audio playback functionality

2. User experience improvements:
   - Added loading states during audio generation
   - Implemented error handling for failed API requests
   - Provided visual feedback during audio playback

## Configuration

### Required Environment Variables

```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GCS_BUCKET_NAME=your-audio-cache-bucket
```

### Vite Configuration

The `vite.config.ts` file was updated to proxy API requests to the local server:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

## Design Decisions and Tradeoffs

### Why Google Cloud TTS?

1. **High-quality Mandarin voices** with natural intonation and accurate pronunciation
2. **Multiple voice options** to provide variety in the learning experience
3. **Support for Pinyin and Chinese characters** to ensure proper pronunciation
4. **Scalable API** with reasonable pricing for our expected usage volume

### Local Server vs Serverless Functions

We chose to implement a local server for development but designed the code to be compatible with serverless deployment:

- **Local development**: Express server for easy debugging and testing
- **Production**: Code structured to work in serverless environments

### Caching Strategy Considerations

1. **Why GCS?**

   - Seamless integration with Google Cloud TTS
   - Cost-effective for audio storage
   - High availability and performance

2. **Alternative approaches considered:**
   - Local file caching: Rejected due to scalability issues
   - Database storage: Rejected due to size and performance concerns
   - CDN integration: Planned for future enhancement

## Known Issues and Future Enhancements

1. **Pronunciation customization**: Allow fine-tuning of speech parameters
2. **Support for additional voices**: Expand voice options for different learning preferences
3. **Offline functionality**: Explore options for downloading frequently used audio
4. **Analytics**: Track most requested phrases to optimize caching strategies

## References

- [Google Cloud Text-to-Speech Documentation](https://cloud.google.com/text-to-speech/docs)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
