/**
 * VocabularyService
 * Core business logic facade for vocabulary operations. This service should
 * contain business rules and orchestrate calls to repository interfaces.
 *
 * Important: keep this class framework-agnostic (no Express/Prisma imports).
 * Repositories are injected so the service can be unit-tested in isolation.
 */
export class VocabularyService {
  constructor(repository) {
    /**
     * repository: an implementation of IVocabularyRepository interface
     * The repository should expose methods like `findAllLists`,
     * `findListById`, `findWordsForList`, and `searchLists`.
     */
    this.repository = repository;
  }

  // Simple pass-through methods that delegate to the repository. Keep
  // business rules here as the project grows (e.g., permission checks,
  // caching decisions, enrichment of results).
  async getAllLists() {
    return this.repository.findAllLists();
  }

  async getListById(listId) {
    return this.repository.findListById(listId);
  }

  async getWordsForList(listId) {
    return this.repository.findWordsForList(listId);
  }

  async searchLists(query, filters) {
    return this.repository.searchLists(query, filters || {});
  }

  // Utilities for extracting metadata used by the API or admin tooling
  extractDistinctDifficulties(lists) {
    const set = new Set();
    lists.forEach((l) => set.add(l.difficulty));
    return Array.from(set);
  }

  extractDistinctTags(lists) {
    const set = new Set();
    lists.forEach((l) => (l.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }
}

export default VocabularyService;
