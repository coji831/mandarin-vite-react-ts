/**
 * useUserIdentity
 *
 * Custom React hook to manage the current user's identity.
 * - Initializes identity from localStorage (via getUserIdentity).
 * - On mount, updates lastActive and refreshes identity.
 * - Provides a manual refresh function (e.g., after login or user switch).
 *
 * Returns: [identity, refresh]
 *   - identity: UserIdentity object
 *   - refresh: function to manually reload identity from localStorage
 */
import { useEffect, useState } from "react";

import { getUserIdentity, updateUserActivity, UserIdentity } from "../utils/progressHelpers";

export function useUserIdentity(): [UserIdentity, () => void] {
  const [identity, setIdentity] = useState<UserIdentity>(() => getUserIdentity());

  // Optionally update lastActive on mount
  useEffect(() => {
    updateUserActivity();
    setIdentity(getUserIdentity());
  }, []);

  // Manual refresh (e.g., after login or switch)
  const refresh = () => setIdentity(getUserIdentity());

  return [identity, refresh];
}
