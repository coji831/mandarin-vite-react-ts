// GoogleTTSClient.ts
// Google Cloud Text-to-Speech (TTS) infrastructure client
// Low-level API client - business logic belongs in core/services/
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { config } from "../../config/index.js";

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
 * Google Cloud Text-to-Speech infrastructure client.
 */
export class GoogleTTSClient {
  private ttsClient: TextToSpeechClient | null = null;

  private getClient(): TextToSpeechClient {
    if (this.ttsClient) return this.ttsClient;
    const ttsCredentials = config.googleTtsCredentials as TtsCredentials | undefined;
    if (!ttsCredentials) {
      throw new Error("GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set");
    }
    this.ttsClient = new TextToSpeechClient({
      credentials: ttsCredentials,
      projectId: ttsCredentials.project_id,
    });
    return this.ttsClient;
  }

  /**
   * Optional explicit initialization of TTS client
   * If not called, client will be lazily initialized on first use
   */
  initialize(credentials: TtsCredentials): void {
    this.ttsClient = new TextToSpeechClient({
      credentials,
      projectId: credentials.project_id,
    });
  }

  /**
   * Synthesize speech from text using Google Cloud TTS
   * @param text
   * @param options (voice, languageCode, audioEncoding)
   * @returns audioContent
   */
  async synthesizeSpeech(
    text: string,
    options: { voice?: string; languageCode?: string; audioEncoding?: string } = {},
  ): Promise<Uint8Array | string | undefined> {
    const client = this.getClient();
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
  async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) return false;
      if (typeof client.listVoices === "function") {
        // lightweight call to verify access (no billing for listing voices)
        await client.listVoices({});
      }
      return true;
    } catch {
      return false;
    }
  }
}
