import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "services";

// Small silent WAV fallback (very short, valid WAV)
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

export async function getAudioUrl(cacheKey: string): Promise<string> {
  try {
    const res = await apiClient.get(
      ROUTE_PATTERNS.examples +
        ROUTE_PATTERNS.examplesAudio +
        `?cacheKey=${encodeURIComponent(cacheKey)}`,
    );
    const url = res.data?.audio_url;
    if (url) return url;
    return SILENT_WAV;
  } catch (err) {
    // Mock/fallback for Story 16.2: return a tiny silent audio data URL
    return SILENT_WAV;
  }
}

export async function playAudio(audioUrl: string): Promise<void> {
  try {
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (err) {
    // Surfacing console error; caller may handle UI
    // Keep error thrown so callers can show messages when needed
    // Some test environments may not have Audio; callers in tests should mock this method.
    console.error("Playback failed:", err);
    throw err;
  }
}
