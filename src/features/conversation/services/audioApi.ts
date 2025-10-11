// src/features/conversation/services/audioApi.ts

import { ConversationAudio } from "../types";

const API_BASE = process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "/api";

export async function requestAudio(params: {
  conversationId: string;
  voice?: string;
  bitrate?: number;
}): Promise<ConversationAudio> {
  const endpoint =
    process.env.NODE_ENV === "development" ? "/scaffold/audio/request" : "/audio/request";

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Audio generation failed: ${response.statusText}`);
  }

  const audioData = await response.json();
  await validateAudioUrl(audioData.audioUrl);
  return audioData;
}

async function validateAudioUrl(url: string): Promise<void> {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`Audio file not accessible: ${url}`);
  }
}
