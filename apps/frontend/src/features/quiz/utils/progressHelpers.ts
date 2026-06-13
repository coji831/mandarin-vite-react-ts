import { UserProgress, UserProgressListEntry } from "../types";

// =========================
// User Identity Management
// =========================

const USER_IDENTITY_KEY = "user_identity";

export type UserIdentity = {
  userId: string;
  lastActive: number;
};

/**
 * Get or create user identity (device-based for now)
 */
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

/**
 * Update last active timestamp for user
 */
export function updateUserActivity(): void {
  const identity = getUserIdentity();
  identity.lastActive = Date.now();
  localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(identity));
}

// =========================
// Progress CRUD Operations
// =========================

const PROGRESS_KEY_PREFIX = "progress_";

/**
 * Get user progress from localStorage, or initialize if not present/corrupt
 */
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

/**
 * Save user progress to localStorage
 */
export function saveUserProgress(userId: string, progress: UserProgress): void {
  const storageKey = `${PROGRESS_KEY_PREFIX}${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

// =========================
// Mastery Conversion Utilities (DEPRECATED - Story 13.4)
// =========================

/**
 * @deprecated Use progress reducer + backend API instead of localStorage
 * Convert stored UserProgress -> { [listId]: Set<string> }
 */
export function restoreMasteredProgress(userProgress: UserProgress): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  if (!userProgress || !Array.isArray(userProgress.lists)) return out;
  userProgress.lists.forEach((list) => {
    const progress = list.progress || {};
    out[list.id] = new Set(Object.keys(progress).filter((k) => progress[k]));
  });
  return out;
}
