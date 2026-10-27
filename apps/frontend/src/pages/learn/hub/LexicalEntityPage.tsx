/**
 * @file LexicalEntityPage.tsx
 * @description The routed Focus surface for a lexical learning session —
 * character / word / radical / chengyu / grammar detail.
 *
 * S2 (session = route, not modal): this page replaces the app-wide hub overlay.
 * A session is a `detail`/Focus surface with a real URL
 * (`/learn/hub/:entityType/:entityId`), so it gets Focus chrome (rail collapsed
 * + recessed top bar) from the archetype, a history entry per hop, and a
 * shareable address. The entity is read from the ROUTE, never from the store —
 * the store only carries the open intent.
 *
 * Navigator parity (regression fix, epic-25): routing the session removed the
 * modal's navigation value — hop between entities, then leave back to where you
 * were. The page restores it from `HubRouteState`, which HubRouteBridge writes on
 * every hub entry: `← Back` walks one hop (or the origin when deep-linked),
 * `Close` unwinds the whole session to the route it was entered from, and the
 * visited entities render as a trail strip. The session also owns a route-level
 * error boundary, so a failing body shows `ErrorScreen` inside the chrome instead
 * of blanking the app.
 *
 * Content is unchanged: the entity bodies (CharacterHub, WordHub, …) still
 * self-fetch and render exactly as they did inside the overlay; only the shell
 * around them changed.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Box, Button, PageShell, PageStack } from "shared/components";
import { hubOriginFor, readHubRouteState } from "shared/hub-entry";
import { useHubStore } from "shared/store";
import type { EntityRef, EntityType } from "shared/types";
import { LexicalHubRouter, entityHubRegistry } from "features/lexical-hub";
import { HubErrorBoundary } from "./HubErrorBoundary";

export type LexicalEntityPageProps = {
  /** Storybook/test override. In the app the route params are the source. */
  entityType?: string;
  entityId?: string;
  /** Display hint only (e.g. a character's pinyin) — content self-fetches. */
  label?: string;
  /** Storybook/test override for the visited-entity trail carried by route state. */
  trail?: EntityRef[];
};

function isEntityType(value: string): value is EntityType {
  return value in entityHubRegistry;
}

/** A trail chip is identifiable by its entity, so the visible label can be a hint. */
function entityKey(ref: EntityRef): string {
  return `${ref.entityType}:${ref.entityId}`;
}

function entityDisplayName(ref: EntityRef): string {
  return ref.label ?? ref.entityId;
}

export function LexicalEntityPage({
  entityType: entityTypeProp,
  entityId: entityIdProp,
  label: labelProp,
  trail: trailProp,
}: LexicalEntityPageProps = {}) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);

  const entityType = entityTypeProp ?? params.entityType;
  const entityId = entityIdProp ?? params.entityId;
  const label = labelProp ?? searchParams.get("label") ?? undefined;

  const entity = useMemo<EntityRef | null>(
    () =>
      entityType && entityId && isEntityType(entityType) ? { entityType, entityId, label } : null,
    [entityType, entityId, label],
  );

  // Keep the store in step with the route so any store reader stays truthful; the
  // URL remains the authority for rendering, and this mirror never navigates.
  useEffect(() => {
    useHubStore.getState().syncFromRoute(entity);
  }, [entity]);

  // Leaving the detail ends the session.
  useEffect(() => () => useHubStore.getState().close(), []);

  const { from, trail } = readHubRouteState(location.state);
  const visited = trailProp ?? trail ?? [];
  const hopCount = visited.length + 1;

  // Back walks real history (one entry per hop, router-owned). A detail reached
  // by a bare URL has no in-app previous entry, so fall back to the recorded
  // entry origin — or the Browse surface the entity is met on.
  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(from ?? (entity ? hubOriginFor(entity.entityType) : "/learn"));
  };

  // Close leaves the whole session, not just the last hop — the routed
  // equivalent of dismissing the old overlay.
  const handleClose = () => {
    if (from) {
      navigate(-hopCount);
      return;
    }
    navigate(entity ? hubOriginFor(entity.entityType) : "/learn", { replace: true });
  };

  // A trail chip rewinds to that step rather than pushing a repeat visit: the
  // trail mirrors the session's history entries one-to-one, so the entry sits
  // `visited.length - index` places back.
  const handleTrailStep = (index: number) => {
    navigate(-(visited.length - index));
  };

  return (
    <PageShell archetype="detail">
      <PageStack size="default">
        <div className="flex flex-align-center gap-sm">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>
          {entity && (
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>

        {entity && visited.length > 0 && (
          <nav
            className="flex flex-wrap flex-align-center gap-xs font-xs text-tertiary"
            aria-label="Session trail"
          >
            {visited.map((ref, index) => (
              <Button
                key={`${entityKey(ref)}:${index}`}
                variant="ghost"
                size="sm"
                onClick={() => handleTrailStep(index)}
                aria-label={`Return to ${entityDisplayName(ref)}`}
              >
                {entityDisplayName(ref)}
              </Button>
            ))}
            <span className="text-secondary" aria-current="page">
              {entityDisplayName(entity)}
            </span>
          </nav>
        )}

        {entity ? (
          <HubErrorBoundary
            key={`${entityKey(entity)}:${attempt}`}
            onRetry={() => setAttempt((current) => current + 1)}
          >
            <LexicalHubRouter entity={entity} />
          </HubErrorBoundary>
        ) : (
          <Box variant="card" padding="md">
            <p className="font-sm text-tertiary m-0">
              That entry could not be found. Pick one from a library to continue.
            </p>
          </Box>
        )}
      </PageStack>
    </PageShell>
  );
}
