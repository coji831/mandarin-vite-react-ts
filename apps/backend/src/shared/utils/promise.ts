/**
 * @file apps/backend/src/shared/utils/promise.ts
 * @description Shared promise utilities.
 */

/**
 * Create a promise that rejects after a specified timeout.
 * Used to enforce time limits on AI API calls.
 *
 * @param ms - Timeout in milliseconds
 * @returns A promise that never resolves, only rejects with "Request timeout"
 */
export function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), ms);
  });
}
