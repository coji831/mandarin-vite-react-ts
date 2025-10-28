/**
 * ProgressStore.ts – Epic 6, Story 6-1
 * Multi-user progress storage and migration utility for Mandarin app.
 * - Provides per-user CRUD, user/device identity, and migration from old format.
 * - Used internally; not yet integrated with main context/hooks.
 */

import { UserProgress } from "../types/Progress";

const USER_IDENTITY_KEY = "user_identity";
const PROGRESS_KEY_PREFIX = "progress_";

export type UserIdentity = {
  userId: string;
  lastActive: number;
};

// TODO (cleanup/epic-9): Migration helpers below (OLD_PROGRESS_KEY and
// migrateOldProgressFormat) are retained for a deprecation window. After
// successful verification in production, remove `OLD_PROGRESS_KEY` usage and
// delete `migrateOldProgressFormat()` and related code. See
// docs/issue-implementation/epic-9-state-performance-core/cleanup-plan.md
// for the removal workflow and verification steps.

// Get or create user identity (device-based for now)
export function getUserIdentity(): UserIdentity {
  const identityRaw = localStorage.getItem(USER_IDENTITY_KEY);
  if (identityRaw) {
    try {
      return JSON.parse(identityRaw);
    } catch (err) {
      // If identity parsing fails, fall through and create a new identity.
      console.warn("Failed to parse user identity from localStorage:", err);
    }
  }
  // Generate new identity
  const newIdentity: UserIdentity = {
    userId: `user_${Math.random().toString(36).slice(2, 10)}`,
    lastActive: Date.now(),
  };
  localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(newIdentity));
  return newIdentity;
}

export function updateUserActivity(): void {
  const identity = getUserIdentity();
  identity.lastActive = Date.now();
  localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(identity));
}

// Progress CRUD
export function getUserProgress(userId: string): UserProgress {
  const storageKey = `${PROGRESS_KEY_PREFIX}${userId}`;
  const storedProgress = localStorage.getItem(storageKey);
  if (storedProgress) {
    try {
      return JSON.parse(storedProgress);
    } catch (err) {
      // Corrupt stored progress - log and reinitialize
      console.warn("Failed to parse stored progress for userId", userId, err);
    }
  }
  // New user: create empty progress
  const newProgress: UserProgress = { lists: [] };
  localStorage.setItem(storageKey, JSON.stringify(newProgress));
  return newProgress;
}

export function saveUserProgress(userId: string, progress: UserProgress): void {
  const storageKey = `${PROGRESS_KEY_PREFIX}${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

// Migration utility: move old single-user progress to new userId
// NOTE: Migration from the old `user_progress` key is removed. Any existing
// migration behavior has already been applied; this cleanup removes the old
// migration hook. If a rollback is necessary, see the cleanup plan at
// docs/issue-implementation/epic-9-state-performance-core/cleanup-plan.md
