/**
 * @file apps/backend/src/core/interfaces/ITTSClient.js
 * @description Interface for Text-to-Speech client operations
 * Defines the contract that infrastructure implementations must follow
 */

/**
 * @typedef {Object} SynthesizeOptions
 * @property {string} [voice] - Voice identifier
 * @property {string} [languageCode] - Language code (e.g., 'cmn-CN')
 * @property {string} [audioEncoding] - Audio encoding format (e.g., 'MP3')
 * @property {number} [speakingRate] - Speaking rate (0.25 to 4.0)
 * @property {number} [pitch] - Voice pitch (-20.0 to 20.0)
 */

/**
 * @typedef {Object} ITTSClient
 * @property {(text: string, options?: SynthesizeOptions) => Promise<Buffer>} synthesizeSpeech - Synthesize speech from text
 * @property {() => Promise<boolean>} healthCheck - Check if TTS service is available
 */
