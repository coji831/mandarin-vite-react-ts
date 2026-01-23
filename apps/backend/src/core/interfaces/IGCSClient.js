/**
 * @file apps/backend/src/core/interfaces/IGCSClient.js
 * @description Interface for Google Cloud Storage client operations
 * Defines the contract that infrastructure implementations must follow
 */

/**
 * @typedef {Object} IGCSClient
 * @property {(filePath: string) => Promise<boolean>} fileExists - Check if file exists in bucket
 * @property {(filePath: string) => Promise<Buffer>} downloadFile - Download file from bucket
 * @property {(filePath: string, buffer: Buffer, contentType?: string) => Promise<void>} uploadFile - Upload file to bucket
 * @property {(filePath: string) => string} getPublicUrl - Get public URL for a file
 */
