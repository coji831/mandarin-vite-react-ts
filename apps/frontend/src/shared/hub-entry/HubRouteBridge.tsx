/**
 * @file HubRouteBridge.tsx
 * @description Turns a hub-open intent into a real route — the mechanism behind
 * "session = route, not modal" (design-revalidation-guide.md §4).
 *
 * `openHub()` stays the single entry point every consumer already calls, but it
 * only records the intent in `hubStore`. This bridge — mounted once in
 * AppLayout — reacts to that intent by NAVIGATING to the detail route, so the
 * session is a routed Focus surface with its own URL, chrome and history entry.
 * There is no overlay to render and nothing to dismiss.
 */
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHubStore } from "shared/store";
import { hubPathFor } from "./hubPath";

export function HubRouteBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOpen = useHubStore((s) => s.isOpen);
  const entityType = useHubStore((s) => s.currentEntity?.entityType);
  const entityId = useHubStore((s) => s.currentEntity?.entityId);
  const label = useHubStore((s) => s.currentEntity?.label);

  useEffect(() => {
    if (!isOpen || !entityType || !entityId) return;

    // Already on the routed detail (e.g. the page mirrored the route into the
    // store) — nothing to do, and no loop.
    if (location.pathname === hubPathFor({ entityType, entityId })) return;

    navigate(hubPathFor({ entityType, entityId }, label));
  }, [isOpen, entityType, entityId, label, location.pathname, navigate]);

  return null;
}
