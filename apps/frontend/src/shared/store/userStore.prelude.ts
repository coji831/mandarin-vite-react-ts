/**
 * userStore.prelude.ts
 *
 * DEPRECATED: Will be removed in Story 17.6.
 * Use userStore.ts (Zustand) instead.
 */
export type UserState = {
  userId?: string | null;
  preferences?: Record<string, unknown>;
};

export const userInitialState: UserState = { userId: null, preferences: {} };

export type UserAction =
  | { type: "USER/SET_ID"; payload: { userId: string } }
  | { type: "USER/SET_PREF"; payload: { key: string; value: unknown } };

export function userReducer(state: UserState = userInitialState, action: UserAction): UserState {
  switch (action.type) {
    case "USER/SET_ID":
      return { ...state, userId: action.payload.userId };
    case "USER/SET_PREF":
      return {
        ...state,
        preferences: { ...(state.preferences || {}), [action.payload.key]: action.payload.value },
      };
    default:
      return state;
  }
}
