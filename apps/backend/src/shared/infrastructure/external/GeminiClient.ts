/**
 * Gemini API Client
 * Low-level client for Google Gemini API text generation.
 * Infrastructure layer - handles authentication and HTTP requests only.
 * Business logic (prompts, parsing, caching) belongs in core/services/.
 */

import { JWT } from "google-auth-library";
import fetch from "node-fetch";
import { config } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("GeminiAPI");

let jwtClient: JWT | null = null;

// ── Gemini API response types ──────────────────────────────────────────────

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
  safetyRatings?: Record<string, unknown>[];
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: Record<string, unknown>;
}

// ── Auth ───────────────────────────────────────────────────────────────────

/**
 * Initialize JWT client for Gemini API authentication
 */
async function getAuthenticatedClient(): Promise<JWT> {
  if (jwtClient) return jwtClient;

  const credentials = config.geminiCredentials;

  if (!credentials?.client_email || !credentials?.private_key) {
    throw new Error("Missing or invalid GEMINI_API_CREDENTIALS_RAW");
  }

  jwtClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });

  return jwtClient;
}

/**
 * Generate text using Gemini API
 * @param prompt - Text prompt for generation
 * @param options - Generation options
 * @param options.model - Model name (default from config)
 * @param options.maxTokens - Max output tokens
 * @param options.temperature - Sampling temperature (0-1)
 * @returns Generated text content
 * @throws If API call fails or returns invalid response
 */
export async function generateText(
  prompt: string,
  options: { model?: string; maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const { model = config.gemini.model, maxTokens, temperature } = options;

  const client = await getAuthenticatedClient();
  const accessToken = await client.getAccessToken();

  const endpoint = `${config.gemini.endpoint}/${model}:generateContent`;

  logger.info(`Calling Gemini API: ${model} at ${endpoint}`);

  const requestBody: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  // Add optional generation config
  if (maxTokens || temperature !== undefined) {
    requestBody.generationConfig = {};
    if (maxTokens)
      (requestBody.generationConfig as Record<string, unknown>).maxOutputTokens = maxTokens;
    if (temperature !== undefined)
      (requestBody.generationConfig as Record<string, unknown>).temperature = temperature;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Gemini API error: ${response.status} - ${errorText}`, new Error(errorText));
    throw new Error(`Gemini API failed: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();

  if (!responseText?.trim()) {
    throw new Error("Gemini API returned empty response");
  }

  let data: GeminiGenerateContentResponse;
  try {
    data = JSON.parse(responseText) as GeminiGenerateContentResponse;
  } catch (error) {
    logger.error(
      `Failed to parse Gemini response: ${responseText.substring(0, 200)}`,
      error as Error,
    );
    throw new Error(`Invalid JSON from Gemini API: ${(error as Error).message}`);
  }

  // Extract text from Gemini response structure
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    logger.error(
      `Unexpected Gemini response structure: ${JSON.stringify(data)}`,
      new Error("Unexpected response"),
    );
    throw new Error("Gemini API response missing expected text content");
  }

  logger.info(`Generated ${generatedText.length} characters from Gemini API`);
  return generatedText;
}

/**
 * Health check for Gemini API connectivity
 * @returns True if API is accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await generateText("Hello", { maxTokens: 5 });
    return true;
  } catch (error) {
    logger.error(`Gemini health check failed: ${(error as Error).message}`, error as Error);
    return false;
  }
}
