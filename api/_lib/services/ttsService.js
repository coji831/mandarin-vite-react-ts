// Dedicated Google Cloud Text-to-Speech (TTS) service
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { config } from "../config/index.js";

let ttsClient = null;

export function getTTSClient() {
  if (ttsClient) return ttsClient;
  const ttsCredentials = config.googleTtsCredentials;
  if (!ttsCredentials) {
    throw new Error("GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set");
  }
  ttsClient = new TextToSpeechClient({
    credentials: ttsCredentials,
    projectId: ttsCredentials.project_id,
  });
  return ttsClient;
}

export async function synthesizeSpeech(text, options = {}) {
  const client = getTTSClient();
  const request = {
    input: { text },
    voice: {
      languageCode: options.languageCode || config.tts.languageCode,
      name: options.voice || config.tts.voiceDefault,
    },
    audioConfig: {
      audioEncoding: options.audioEncoding || config.tts.audioEncoding,
    },
  };
  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent;
}
