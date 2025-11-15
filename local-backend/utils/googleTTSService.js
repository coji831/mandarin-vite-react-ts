// local-backend/utils/googleTTSService.js
// Modular Google Cloud Text-to-Speech service logic
// Loads credentials from environment variables only

import { TextToSpeechClient } from "@google-cloud/text-to-speech";

let ttsClient = null;

export function getTTSClient() {
  if (ttsClient) return ttsClient;
  const ttsCredentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_RAW;
  if (!ttsCredentialsJson) {
    throw new Error("GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set");
  }
  const ttsCredentials = JSON.parse(ttsCredentialsJson);
  ttsClient = new TextToSpeechClient({
    credentials: ttsCredentials,
    projectId: ttsCredentials.project_id,
  });
  return ttsClient;
}

/**
 * Synthesize speech from text using Google Cloud TTS
 * @param {string} text
 * @param {object} options (voice, languageCode, audioEncoding)
 * @returns {Promise<Buffer>} audioContent
 */
export async function synthesizeSpeech(text, options = {}) {
  const client = getTTSClient();
  const request = {
    input: { text },
    voice: {
      languageCode: options.languageCode || "cmn-CN",
      name: options.voice || "cmn-CN-Standard-A",
    },
    audioConfig: {
      audioEncoding: options.audioEncoding || "MP3",
    },
  };
  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent;
}
