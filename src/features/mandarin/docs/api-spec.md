# Mandarin Feature API Specification

## Text-to-Speech API

- Endpoint: `/api/get-tts-audio`
- Method: POST
- Body: `{ text: string }` (1-15 words of Mandarin text)
- Response: `{ audioUrl: string }` (Google Cloud Storage URL)
- Used by: `PlayButton` component to generate audio for vocabulary

## Data Loading

- Vocabulary and example sentences are loaded from static JSON files in `src/data/`.
- No external API for vocabulary; all data is local.
