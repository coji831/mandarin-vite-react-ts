/**
 * @file apps/backend/src/core/interfaces/IAIClient.js
 * @description Interface for AI/LLM client operations (Gemini, OpenAI, etc.)
 * Defines the contract that infrastructure implementations must follow
 */

/**
 * @typedef {Object} GenerateOptions
 * @property {string} [model] - Model identifier
 * @property {number} [temperature] - Sampling temperature (0.0 to 1.0)
 * @property {number} [maxTokens] - Maximum tokens to generate
 * @property {string[]} [stopSequences] - Stop sequences
 */

/**
 * @typedef {Object} IAIClient
 * @property {(prompt: string, options?: GenerateOptions) => Promise<string>} generateText - Generate text from prompt
 * @property {() => Promise<boolean>} healthCheck - Check if AI service is available
 */
