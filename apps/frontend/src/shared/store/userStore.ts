/**
 * @file apps/frontend/src/shared/store/userStore.ts
 * @description Zustand store for user state (Story 17.5)
 *
 * Replaces userStore.prelude.ts. Manages userId and preferences.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface UserPreferences {
  theme?: string;
  language?: string;
}

export interface UserState {
  userId: string | null;
  preferences: UserPreferences | null;

  setUserId: (userId: string | null) => void;
  setPreferences: (preferences: UserPreferences) => void;
  refresh: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      userId: null,
      preferences: null,

      setUserId: (userId) => set({ userId }),
      setPreferences: (preferences) => set({ preferences }),
      refresh: () => {
        const storedId = localStorage.getItem("deviceUserId");
        if (storedId) set({ userId: storedId });
      },
      reset: () => set({ userId: null, preferences: null }),
    }),
    { name: "user-store" },
  ),
);
