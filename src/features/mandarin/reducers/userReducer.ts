/**
 * userReducer.ts
 *
 * Contains user-related state (identity, preferences) used by the progress domain.
 * Automation: see docs/automation/ai-file-operations.md
 */
export interface UserState {
  userId?: string | null;
  preferences?: Record<string, any>;
}

export const userInitialState: UserState = { userId: null, preferences: {} };

export type UserAction =
  | { type: "USER/SET_ID"; payload: { userId: string } }
  | { type: "USER/SET_PREF"; payload: { key: string; value: any } };

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
