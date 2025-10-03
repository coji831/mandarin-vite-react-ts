import { useEffect, useState } from "react";
import { getUserIdentity, updateUserActivity, UserIdentity } from "../utils/ProgressStore";

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
