// Centralized configuration for all backend services
export const config = {
  googleTtsCredentials: JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS_RAW || "{}"),
  geminiCredentials: JSON.parse(process.env.GEMINI_API_CREDENTIALS_RAW || "{}"),
  gcsCredentials: JSON.parse(
    process.env.GCS_CREDENTIALS_RAW || process.env.GOOGLE_TTS_CREDENTIALS_RAW || "{}"
  ),
  gcsBucket: process.env.GCS_BUCKET_NAME,
  tts: {
    voiceDefault: "cmn-CN-Wavenet-B",
    languageCode: "cmn-CN",
    maxWords: 15,
    audioEncoding: "MP3",
  },
  gemini: {
    model: process.env.GEMINI_MODEL || "models/gemini-2.0-flash-lite",
    endpoint: process.env.GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta",
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "1000", 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
  },
  cachePaths: {
    tts: "tts/{hash}.mp3",
    conversationText: "convo/{wordId}/{hash}.json",
    conversationAudio: "convo/{wordId}/{hash}.mp3",
  },
};
export default config;
