// Unified selectors for normalized vocabulary and progress data (Epic 10-4)
import type { RootState } from "./reducers/rootReducer";
import type { WordEntity } from "./types/ProgressNormalized";

/**
 * selectWordEntity: Returns the normalized vocab entity by wordId
 */
export function selectWordEntity(state: RootState, wordId: string): WordEntity | undefined {
  return state.lists.wordsById[wordId];
}

/**
 * selectAllWordEntities: Returns an array of all vocab entities in normalized order
 */
export function selectAllWordEntities(state: RootState): WordEntity[] {
  return state.lists.wordIds.map((wordId) => state.lists.wordsById[wordId]);
}
