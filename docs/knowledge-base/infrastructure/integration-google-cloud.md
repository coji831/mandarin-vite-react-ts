# Google Cloud Services

**Category:** Third-Party Integrations  
**Last Updated:** December 9, 2025

---

## Google Cloud Text-to-Speech (TTS)

**When Adopted:** Epic 1 (Google Cloud TTS Integration)  
**Why:** High-quality Mandarin pronunciation, scalable audio generation  
**Use Case:** Generate audio for 10k+ vocabulary words on-demand

### Minimal Example

```typescript
// 1. Install
npm install @google-cloud/text-to-speech

import textToSpeech from '@google-cloud/text-to-speech';

// 2. Initialize client
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: './google-credentials.json', // Service account key
});

// 3. Generate Mandarin audio
async function generateMandarin(text: string): Promise<Buffer> {
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'cmn-CN',      // Mandarin Chinese
      name: 'cmn-CN-Wavenet-A',    // High-quality voice
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,           // Slightly slower for learning
      pitch: 0,
    },
  });

  return response.audioContent as Buffer;
}

// 4. Serverless function (Vercel API route)
export default async function handler(req, res) {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const audio = await generateMandarin(text as string);

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  res.send(audio);
}
```

### Key Lessons

- Use Wavenet voices for natural sound
- Cache audio files (expensive API calls)
- Adjust `speakingRate` for language learning (0.8-0.9)
- Handle rate limits (quota: 4M chars/month free)

### When to Use

Language learning, accessibility, dynamic audio content

---

## Google Cloud Storage (GCS)

**When Adopted:** Epic 8 (Conversation Generation)  
**Why:** Store generated conversations, serve static files  
**Use Case:** Persist AI-generated content, reduce API costs

### Minimal Example

```typescript
// 1. Install
npm install @google-cloud/storage

import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  keyFilename: './google-credentials.json',
});

const bucket = storage.bucket('mandarin-app-conversations');

// 2. Upload file
async function uploadConversation(filename: string, content: string): Promise<string> {
  const file = bucket.file(filename);

  await file.save(content, {
    contentType: 'application/json',
    metadata: {
      cacheControl: 'public, max-age=86400', // 1 day
    },
  });

  // Get public URL
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return url;
}

// 3. Download file
async function downloadConversation(filename: string): Promise<string> {
  const [content] = await bucket.file(filename).download();
  return content.toString('utf-8');
}

// 4. List files
async function listConversations(): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix: 'conversations/' });
  return files.map(file => file.name);
}
```

### Key Lessons

- Use signed URLs for temporary public access
- Set `cacheControl` headers for performance
- Organize with prefixes (folders): `conversations/`, `audio/`
- Use lifecycle policies to delete old files automatically

### When to Use

Large file storage, static asset hosting, backup/archival

---

## Google Gemini AI (Conversation Generation)

**When Adopted:** Epic 8 (Conversation Generation)  
**Why:** Generate contextual Mandarin conversations with vocabulary  
**Use Case:** Adaptive learning content based on user progress

### Minimal Example

```typescript
// 1. Install
npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 2. Generate conversation
async function generateConversation(words: string[]): Promise<Conversation> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    Generate a natural Mandarin Chinese conversation using these vocabulary words:
    ${words.join(', ')}

    Requirements:
    - 6-8 exchanges between two speakers
    - HSK 2-3 difficulty level
    - Include pinyin and English translation
    - Natural, daily-life context

    Format as JSON:
    {
      "title": "conversation title",
      "exchanges": [
        { "speaker": "A", "chinese": "你好", "pinyin": "nǐ hǎo", "english": "Hello" }
      ]
    }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON from response
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  return JSON.parse(json || '{}');
}

// 3. Streaming response (for long content)
async function* streamConversation(words: string[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}
```

### Key Lessons

- Use structured prompts with examples (few-shot learning)
- Validate JSON responses (AI sometimes adds markdown)
- Cache generated content to reduce API costs
- Use streaming for real-time UI feedback
- Handle rate limits (60 requests/minute)

### When to Use

AI-generated content, adaptive learning, personalized experiences

---

**Related Guides:**

- [Caching Strategies](./integration-caching.md) — Cache TTS audio and conversations
- [Deployment](./infra-deployment.md) — Environment variables for API keys
