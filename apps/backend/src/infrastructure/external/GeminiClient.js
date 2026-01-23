/**
 * Gemini API Client
 * Low-level client for Google Gemini API text generation.
 * Infrastructure layer - handles authentication and HTTP requests only.
 * Business logic (prompts, parsing, caching) belongs in core/services/.
 */

import { config } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("GeminiAPI");

let jwtClient = null;

/**
 * Initialize JWT client for Gemini API authentication
 * @private
 */
async function getAuthenticatedClient() {
  if (jwtClient) return jwtClient;

  const { JWT } = await import("google-auth-library");
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
 * @param {string} prompt - Text prompt for generation
 * @param {Object} options - Generation options
 * @param {string} [options.model] - Model name (default from config)
 * @param {number} [options.maxTokens] - Max output tokens
 * @param {number} [options.temperature] - Sampling temperature (0-1)
 * @returns {Promise<string>} Generated text content
 * @throws {Error} If API call fails or returns invalid response
 */
export async function generateText(prompt, options = {}) {
  const { model = config.gemini.model, maxTokens, temperature } = options;

  const client = await getAuthenticatedClient();
  const accessToken = await client.getAccessToken();
  const fetch = (await import("node-fetch")).default;

  const endpoint = `${config.gemini.endpoint}/${model}:generateContent`;

  logger.debug(`Calling Gemini API: ${model}`);

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  // Add optional generation config
  if (maxTokens || temperature !== undefined) {
    requestBody.generationConfig = {};
    if (maxTokens) requestBody.generationConfig.maxOutputTokens = maxTokens;
    if (temperature !== undefined) requestBody.generationConfig.temperature = temperature;
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
    logger.error(`Gemini API error: ${response.status} - ${errorText}`);
    throw new Error(`Gemini API failed: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();

  if (!responseText?.trim()) {
    throw new Error("Gemini API returned empty response");
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    logger.error(`Failed to parse Gemini response: ${responseText.substring(0, 200)}`);
    throw new Error(`Invalid JSON from Gemini API: ${error.message}`);
  }

  // Extract text from Gemini response structure
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    logger.error(`Unexpected Gemini response structure: ${JSON.stringify(data)}`);
    throw new Error("Gemini API response missing expected text content");
  }

  logger.debug(`Generated ${generatedText.length} characters`);
  return generatedText;
}

/**
 * Health check for Gemini API connectivity
 * @returns {Promise<boolean>} True if API is accessible
 */
export async function healthCheck() {
  try {
    await generateText("Hello", { maxTokens: 5 });
    return true;
  } catch (error) {
    logger.error(`Gemini health check failed: ${error.message}`);
    return false;
  }
}
