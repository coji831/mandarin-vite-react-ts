/**
 * @file services/readingProgressService.ts
 * @description API service for reading progress — session position, completion, bookmarks.
 * Story 21.7: Reading Progress
 *
 * Follows the service layer pattern: every HTTP request goes through a service file.
 * See frontend-api-client.instructions.md.
 */
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";

export type SessionResponse = {
  currentSentence: number;
  isCompleted: boolean;
};

export type BookmarkListResponse = {
  bookmarks: string[];
};

export type BookmarkCheckResponse = {
  isBookmarked: boolean;
};

export const readingProgressService = {
  /** GET /v1/readers/sessions/:passageId — get or create reading session. */
  async getSession(passageId: string): Promise<SessionResponse> {
    const response = await apiClient.get(ROUTE_PATTERNS.readersSessionByPassageId(passageId), {
      timeout: 10000,
    });
    return response.data.data ?? response.data;
  },

  /** PUT /v1/readers/sessions/:passageId — update reading position. */
  async updatePosition(passageId: string, currentSentence: number): Promise<void> {
    await apiClient.put(
      ROUTE_PATTERNS.readersSessionByPassageId(passageId),
      { currentSentence },
      { timeout: 10000 },
    );
  },

  /** POST /v1/readers/sessions/:passageId/complete — mark passage completed. */
  async completePassage(passageId: string): Promise<void> {
    await apiClient.post(
      ROUTE_PATTERNS.readersSessionCompleteByPassageId(passageId),
      {},
      { timeout: 10000 },
    );
  },

  /** GET /v1/readers/bookmarks — list bookmarked passage IDs. */
  async listBookmarks(): Promise<BookmarkListResponse> {
    const response = await apiClient.get(ROUTE_PATTERNS.readersBookmarks, { timeout: 10000 });
    return response.data.data ?? response.data;
  },

  /** POST /v1/readers/bookmarks — add bookmark by passage ID. */
  async addBookmark(passageId: string): Promise<void> {
    await apiClient.post(ROUTE_PATTERNS.readersBookmarks, { passageId }, { timeout: 10000 });
  },

  /** DELETE /v1/readers/bookmarks/by-passage/:passageId — remove bookmark by passage ID. */
  async removeBookmarkByPassage(passageId: string): Promise<void> {
    await apiClient.delete(ROUTE_PATTERNS.readersBookmarkByPassageId(passageId), {
      timeout: 10000,
    });
  },

  /** GET /v1/readers/bookmarks/by-passage/:passageId — check if a single passage is bookmarked. */
  async checkBookmarkByPassage(passageId: string): Promise<BookmarkCheckResponse> {
    const response = await apiClient.get(ROUTE_PATTERNS.readersBookmarkByPassageId(passageId), {
      timeout: 10000,
    });
    return response.data.data ?? response.data;
  },
};
