// GoogleTTSClient.ts
// Google Cloud Text-to-Speech (TTS) infrastructure client
// Low-level API client - business logic belongs in core/services/
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import type { protos } from "@google-cloud/text-to-speech";
import { config } from "../../config/index.js";

let ttsClient: TextToSpeechClient | null = null;

/**
 * Type for TTS service account credentials.
 */
interface TtsCredentials {
  client_email?: string;
  private_key?: string;
  project_id?: string;
  [key: string]: unknown;
}

/**
 * Optional explicit initialization of TTS client
 * If not called, client will be lazily initialized on first use
 */
export function initializeTTS(credentials: TtsCredentials): void {
  ttsClient = new TextToSpeechClient({
    credentials,
    projectId: credentials.project_id,
  });
}

export function getTTSClient(): TextToSpeechClient {
  if (ttsClient) return ttsClient;
  const ttsCredentials = config.googleTtsCredentials as TtsCredentials | undefined;
  if (!ttsCredentials) {
    throw new Error("GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set");
  }
  ttsClient = new TextToSpeechClient({
    credentials: ttsCredentials,
    projectId: ttsCredentials.project_id,
  });
  return ttsClient;
}

/**
 * Synthesize speech from text using Google Cloud TTS
 * @param text
 * @param options (voice, languageCode, audioEncoding)
 * @returns audioContent
 */
export async function synthesizeSpeech(
  text: string,
  options: { voice?: string; languageCode?: string; audioEncoding?: string } = {},
): Promise<Uint8Array | string | undefined> {
  const client = getTTSClient();
  const request: Record<string, unknown> = {
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
  return response.audioContent as Uint8Array | string | undefined;
}

/**
 * Health check for Google Cloud TTS
 * Attempts a lightweight API call (listVoices) if available to validate credentials.
 * @returns True if TTS accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getTTSClient();
    if (!client) return false;
    if (typeof client.listVoices === "function") {
      // lightweight call to verify access (no billing for listing voices)
      await client.listVoices({});
    }
    return true;
  } catch (err) {
    return false;
  }
}
