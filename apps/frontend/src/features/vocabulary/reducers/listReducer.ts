import { ListState } from "../types";

export const listsInitialState: ListState = { itemsById: {}, itemIds: [] };

export type ListAction = { type: "INIT" } | { type: "RESET" };

export function listsReducer(state: ListState = listsInitialState, action: ListAction): ListState {
  switch (action.type) {
    case "INIT":
      return state;
    case "RESET":
      return listsInitialState;
    default:
      return state;
  }
}
