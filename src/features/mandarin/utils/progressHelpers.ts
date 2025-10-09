/**
 * ProgressStore.ts – Epic 6, Story 6-1
 * Multi-user progress storage and migration utility for Mandarin app.
 * - Provides per-user CRUD, user/device identity, and migration from old format.
 * - Used internally; not yet integrated with main context/hooks.
 */

import { UserProgress } from "../types/Progress";

const USER_IDENTITY_KEY = "user_identity";
const PROGRESS_KEY_PREFIX = "progress_";
const OLD_PROGRESS_KEY = "user_progress";

export type UserIdentity = {
  userId: string;
  lastActive: number;
};

// Get or create user identity (device-based for now)
export function getUserIdentity(): UserIdentity {
  let identityRaw = localStorage.getItem(USER_IDENTITY_KEY);
  if (identityRaw) {
    try {
      return JSON.parse(identityRaw);
    } catch {}
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
    } catch {}
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
export function migrateOldProgressFormat(): void {
  const old = localStorage.getItem(OLD_PROGRESS_KEY);
  if (!old) return;
  try {
    const progress: UserProgress = JSON.parse(old);
    const { userId } = getUserIdentity();
    saveUserProgress(userId, progress);
    localStorage.removeItem(OLD_PROGRESS_KEY);
  } catch {}
}
