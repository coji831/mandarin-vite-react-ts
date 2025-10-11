// Utility functions for generator cache and conversation

export async function generateConversationText(wordId, prompt, generatorVersion) {
  // Integrate with Gemini API for text generation
  const geminiCredentialsRaw = process.env.GEMINI_API_CREDENTIALS_RAW;
  if (!geminiCredentialsRaw) throw new Error("Missing GEMINI_API_CREDENTIALS_RAW env var");
  const geminiCredentials = JSON.parse(geminiCredentialsRaw);
  const { JWT } = await import("google-auth-library");
  const fetch = (await import("node-fetch")).default;

  // Use JWT constructor instead of deprecated fromJSON
  const client = new JWT({
    email: geminiCredentials.client_email,
    key: geminiCredentials.private_key,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });

  // Use the specified model directly without checking availability
  const modelName = "models/gemini-2.0-flash-lite";

  const accessToken = await client.getAccessToken();

  // Updated API endpoint and request format for current Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}. Please respond with a simple conversation in this format:
                      A: [first speaker line]
                      B: [second speaker line]
                      A: [third speaker line]
                      B: [fourth speaker line]
                    Keep it conversational and natural, with exactly 4 lines total. Only use Mandarin Chinese characters—do not include pinyin, English, or any translations.`,
              },
            ],
          },
        ],
      }),
    }
  );
  const data = await response.json();
  // console.log("[TextGenerator] Gemini API response received:", JSON.stringify(data, null, 2));

  // Parse Gemini response to extract conversation turns
  let turns = [];

  // Check for API errors first
  if (data.error) {
    console.log("[TextGenerator] Gemini API error detected:");

    if (data.error.code === 403 && data.error.message?.includes("SERVICE_DISABLED")) {
      console.log("[TextGenerator] Generative Language API is disabled.");
      console.log(
        "[TextGenerator] To fix: Enable the API at:",
        data.error.details?.[0]?.metadata?.activationUrl
      );
    } else if (data.error.code === 403) {
      console.log("[TextGenerator] Permission denied - check API key and project access");
    } else if (data.error.code === 404) {
      console.log("[TextGenerator] Model not found - check the model name and endpoint");
    }

    console.log("[TextGenerator] Using fallback conversation due to API error");
  }

  // Updated parsing for new Gemini API response format
  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
    // New API format: data.candidates[0].content.parts[0].text
    const generatedText = data.candidates[0].content.parts[0].text;
    console.log("[TextGenerator] Generated text:", generatedText);

    // Parse the conversation format A: ... B: ... A: ... B: ...
    const lines = generatedText.split("\n").filter((line) => line.trim());
    turns = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("A:")) {
        console.log(`[TextGenerator]  A turn detected: ${trimmed.substring(2).trim()}`);
        turns.push({ speaker: "A", text: trimmed.substring(2).trim() });
      } else if (trimmed.startsWith("B:")) {
        console.log(`[TextGenerator]  B turn detected: ${trimmed.substring(2).trim()}`);
        turns.push({ speaker: "B", text: trimmed.substring(2).trim() });
      }
    }

    // Ensure we have 3-5 turns
    if (turns.length < 3) {
      console.log("[TextGenerator] Not enough turns generated, using fallback");
      turns = [];
    } else {
      turns = turns.slice(0, 5); // Limit to 5 turns max
      console.log(`[TextGenerator] Successfully parsed ${turns.length} conversation turns`);
    }
  }

  // Fallback if no valid response or not enough turns
  if (turns.length === 0) {
    console.log("[TextGenerator] No valid candidates in response, using fallback");
    turns = fallbackTurns(wordId);
  }
  return {
    id: "",
    generatedAt: "",
    wordId,
    generatorVersion,
    prompt,
    turns,
  };
}

function fallbackTurns(wordId) {
  return [
    { speaker: "A", text: `Hi, can you use '${wordId}' in a sentence?` },
    { speaker: "B", text: `Sure! '${wordId}' means something important.` },
    { speaker: "A", text: `Great, can you give another example?` },
    { speaker: "B", text: `Of course, here's another example with ${wordId}.` },
  ];
}
