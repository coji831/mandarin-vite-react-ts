// src/features/conversation/services/audioApi.ts

import { API_ROUTES } from "../../../../shared/constants/apiPaths";
import { ConversationAudio } from "../types";

export async function requestAudio(params: {
  wordId: string;
  voice?: string;
  bitrate?: number;
}): Promise<ConversationAudio> {
  const endpoint = API_ROUTES.conversationAudioGenerate;

  const response = await fetch(endpoint, {
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
  return audioData;
}
