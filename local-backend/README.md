# Local Backend

This directory contains the local Express server for development, providing Text-to-Speech functionality and caching via Google Cloud services.

## Purpose

The local backend serves as a development environment for the serverless functions in the `api/` directory, allowing developers to test and debug TTS functionality without deploying to production.

## Features

- **Express Server**: Handles API requests from the frontend
- **Google Cloud TTS Integration**: Converts Mandarin text to speech
- **GCS Caching**: Stores and retrieves audio files to optimize performance and reduce API costs
- **Error Handling**: Provides detailed error information during development

## Setup

1. Install dependencies: `npm install`
2. Set up environment variables (see below)
3. Start the server: `npm run server`

## Environment Variables

Create a `.env` file in this directory with:

```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GCS_BUCKET_NAME=your-audio-cache-bucket
```

## Related Documentation

For detailed implementation information, see:

- [`docs/issues/google-cloud-tts-integration.md`](../docs/issues/google-cloud-tts-integration.md)
