/**
 * useUserIdentity
 *
 * Story 17.5: Reads from Zustand userStore. Falls back to localStorage.
 * Will be removed in Story 17.6 — use useUserStore directly.
 */
import { useEffect } from "react";

import { useUserStore } from "../../../shared/store/userStore";
import { getUserIdentity, updateUserActivity, UserIdentity } from "../utils";

export function useUserIdentity(): [UserIdentity, () => void] {
  const userId = useUserStore((s) => s.userId);
  const refresh = useUserStore((s) => s.refresh);

  useEffect(() => {
    updateUserActivity();
    const identity = getUserIdentity();
    if (identity?.userId && !userId) {
      useUserStore.getState().setUserId(identity.userId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [
    { userId: userId || getUserIdentity()?.userId || null },
    () => useUserStore.getState().refresh(),
  ];
}
