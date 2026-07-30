/**
 * @file apps/backend/src/modules/characters/services/PinyinSearchService.ts
 * @description Service for pinyin-based character search.
 *
 * Clean Architecture: Application/business logic layer.
 * Validates inputs and delegates data access to PinyinSearchRepository.
 */

import {
  PinyinSearchRepository,
  type PinyinSearchParams,
  type PinyinSearchResponse,
} from "../repositories/PinyinSearchRepository.js";
import { PinyinValidationError } from "../types/pinyin.js";

export class PinyinSearchService {
  private repository: PinyinSearchRepository;

  constructor(repository: PinyinSearchRepository) {
    this.repository = repository;
  }

  async search(params: PinyinSearchParams): Promise<PinyinSearchResponse> {
    const { q, page = 1, pageSize = 50 } = params;

    if (!q || q.trim().length === 0) {
      throw new PinyinValidationError("Query parameter 'q' is required");
    }

    const validatedPageSize = Math.min(pageSize, 100);
    const validatedPage = Math.max(1, page);

    return this.repository.searchByPinyin({
      q: q.trim(),
      tone: params.tone,
      page: validatedPage,
      pageSize: validatedPageSize,
    });
  }
}
