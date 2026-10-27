/**
 * @file HubRouteBridge.tsx
 * @description Turns one hub-open INTENT into one real navigation — the
 * mechanism behind "session = route, not modal" (design-revalidation-guide.md §4).
 *
 * `openHub()` stays the single entry point every consumer calls, but it only
 * records a request in `hubStore`. This bridge — mounted once in AppLayout —
 * acts on that request exactly ONCE: it consumes it, then navigates to the
 * detail route, so the session is a routed Focus surface with its own URL,
 * chrome and history entry.
 *
 * Regression fix (epic-25): this bridge used to watch `isOpen` — the same flag
 * `syncFromRoute()` wrote — so a hub route looked like a permanently pending
 * intent and every departure (Back, rail link, Login) was rewritten back to the
 * hub. It now watches ONLY the consumable `requestedEntity` intent, compares the
 * destination by entity type + id (not by pathname), and never reacts to the
 * route mirror. Navigating away from a hub route is therefore never corrected.
 */
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHubStore } from "shared/store";
import { hubEntityFromPath, hubPathFor, readHubRouteState, type HubRouteState } from "./hubPath";

export function HubRouteBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const request = useHubStore((s) => s.requestedEntity);
  const consumeRequest = useHubStore((s) => s.consumeRequest);

  // StrictMode replays effects with the SAME closure, so the store update from
  // consumeRequest() alone cannot stop a second run from navigating twice.
  const spentToken = useRef<number | null>(null);

  const { pathname, search, state: locationState } = location;

  useEffect(() => {
    if (!request || spentToken.current === request.token) return;

    // An intent is single-use: spend it before acting, so no later render,
    // unmount or replayed effect can act on it again.
    spentToken.current = request.token;
    consumeRequest(request.token);

    const { entityType, entityId, label } = request.ref;
    const active = hubEntityFromPath(pathname, search);

    // Already showing this very entity — nothing to navigate to. (A different
    // entity on the same route is a hop, handled below.)
    if (active?.entityType === entityType && active?.entityId === entityId) return;

    const previous = readHubRouteState(locationState);
    const state: HubRouteState = active
      ? // Hop inside the session: keep the entry origin, remember where we were.
        { from: previous.from, trail: [...(previous.trail ?? []), active] }
      : // Entering the session from a Browse surface — remember it for Close.
        { from: `${pathname}${search}`, trail: [] };

    navigate(hubPathFor({ entityType, entityId }, label), { state });
  }, [request, consumeRequest, pathname, search, locationState, navigate]);

  return null;
}
