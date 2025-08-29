import { useProgressContext } from "./ProgressContext";

/**
 * Custom hook to consume Mandarin progress context with strict typing.
 */
export function useMandarinContext() {
  return useProgressContext();
}
