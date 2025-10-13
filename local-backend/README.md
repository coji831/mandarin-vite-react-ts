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

Recommended environment variables for local development (set in `.env`) and for Vercel:

- `GOOGLE_TTS_CREDENTIALS_RAW` (recommended): a stringified Google service account JSON used by the TTS/local functions. Example: `{"type":"service_account",...}`
- `GCS_BUCKET_NAME` (required for caching): Name of the Google Cloud Storage bucket used for audio caching

Optional local-file fallback:

- `GOOGLE_APPLICATION_CREDENTIALS`: path to service-account JSON file. This is supported for local convenience but using `GOOGLE_TTS_CREDENTIALS_RAW` keeps parity with Vercel deployments.

Tip (PowerShell) to add the stringified JSON to `.env` from a file:

```powershell
$json = Get-Content -Raw path\to\service-account.json; $json | Out-File -FilePath .env -Encoding utf8 -Append
```

## Related Documentation

For detailed implementation information, see:

- See the [issue implementation documentation](../docs/issue-implementation/) for details on feature integrations.
