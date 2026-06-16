/**
 * useProgressDispatch.ts
 *
 * Story 17.5: Returns a noop function. Dispatch is no longer used —
 * components should call Zustand store actions directly.
 * Will be removed in Story 17.6.
 */

export function useProgressDispatch(): React.Dispatch<any> {
  // Dispatch is no-op — Zustand stores manage state directly
  const noop: React.Dispatch<any> = () => {};
  return noop;
}
