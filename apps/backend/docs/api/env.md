# Environment Variables

## Required (Real Mode)

| Variable                     | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `GCS_BUCKET_NAME`            | Google Cloud Storage bucket name              |
| `GOOGLE_TTS_CREDENTIALS_RAW` | Service account JSON (stringified)            |
| `GEMINI_API_CREDENTIALS_RAW` | Service account JSON for Gemini (stringified) |

## Optional

| Variable               | Default                        | Description                   |
| ---------------------- | ------------------------------ | ----------------------------- |
| `GCS_CREDENTIALS_RAW`  | TTS credentials                | Dedicated GCS service account |
| `PORT`                 | 3001                           | Server port                   |
| `GEMINI_MODEL`         | `models/gemini-3.1-flash-lite` | Gemini model name             |
| `GEMINI_TEMPERATURE`   | 0.7                            | Sampling temperature 0-1      |
| `GEMINI_MAX_TOKENS`    | 1000                           | Max output tokens             |
| `ENABLE_DETAILED_LOGS` | false                          | Enable debug logs             |
| `ENABLE_CACHE`         | true                           | Enable caching                |
| `ENABLE_METRICS`       | false                          | Enable metrics collection     |

> **Full reference:** See [Environment Setup Guide](../../../docs/guides/getting-started/environment-setup.md) for all variables, defaults, and optional configuration.
