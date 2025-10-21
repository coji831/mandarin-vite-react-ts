/**
 * useProgressDispatch.ts
 *
 * Provides access to the Progress reducer dispatch function from `ProgressDispatchContext`.
 * Keep usage minimal and prefer action creator wrappers when possible for better discoverability.
 */
import { useContext } from "react";
import { ProgressDispatchContext } from "../context";
import { ProgressAction } from "../reducers";

export function useProgressDispatch(): React.Dispatch<ProgressAction> {
  const dispatch = useContext(ProgressDispatchContext);
  if (!dispatch) throw new Error("useProgressDispatch must be used within ProgressProvider");
  return dispatch;
}
