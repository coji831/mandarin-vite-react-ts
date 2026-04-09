import axios from "axios";

export interface Example {
  chinese: string;
  pinyin: string;
  english: string;
}

export async function fetchExamples(
  word: string,
  hskLevel: number,
  language: string,
): Promise<Example[]> {
  const response = await axios.post("/api/examples", { word, hskLevel, language });
  return response.data?.data ?? [];
}

async function sha256hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getCacheKey(
  word: string,
  hskLevel: number,
  language: string,
): Promise<string> {
  const input = `${word}|${hskLevel}|${language}|v1`;
  return sha256hex(input);
}
