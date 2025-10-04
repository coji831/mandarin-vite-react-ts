import React, { createContext, useContext, ReactNode } from "react";
import { useUserIdentity } from "../hooks/useUserIdentity";
import { UserIdentity } from "../utils/ProgressStore";

type UserIdentityContextType = {
  identity: UserIdentity;
  refresh: () => void;
};

const UserIdentityContext = createContext<UserIdentityContextType | undefined>(undefined);

type UserIdentityProviderProps = { children: ReactNode };
export function UserIdentityProvider({ children }: UserIdentityProviderProps) {
  const [identity, refresh] = useUserIdentity();
  return (
    <UserIdentityContext.Provider value={{ identity, refresh }}>
      {children}
    </UserIdentityContext.Provider>
  );
}

export function useUserIdentityContext() {
  const ctx = useContext(UserIdentityContext);
  if (!ctx) throw new Error("useUserIdentityContext must be used within a UserIdentityProvider");
  return ctx;
}
