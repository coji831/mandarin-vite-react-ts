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
 * Content is unchanged: the entity bodies (CharacterHub, WordHub, …) still
 * self-fetch and render exactly as they did inside the overlay; only the shell
 * around them changed.
 */
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Box, Button, PageShell, PageStack } from "shared/components";
import { hubOriginFor } from "shared/hub-entry";
import { useHubStore } from "shared/store";
import type { EntityRef, EntityType } from "shared/types";
import { LexicalHubRouter, entityHubRegistry } from "features/lexical-hub";

export type LexicalEntityPageProps = {
  /** Storybook/test override. In the app the route params are the source. */
  entityType?: string;
  entityId?: string;
  /** Display hint only (e.g. a character's pinyin) — content self-fetches. */
  label?: string;
};

function isEntityType(value: string): value is EntityType {
  return value in entityHubRegistry;
}

export function LexicalEntityPage({
  entityType: entityTypeProp,
  entityId: entityIdProp,
  label: labelProp,
}: LexicalEntityPageProps = {}) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const entityType = entityTypeProp ?? params.entityType;
  const entityId = entityIdProp ?? params.entityId;
  const label = labelProp ?? searchParams.get("label") ?? undefined;

  const entity = useMemo<EntityRef | null>(
    () =>
      entityType && entityId && isEntityType(entityType) ? { entityType, entityId, label } : null,
    [entityType, entityId, label],
  );

  // Keep the store in step with the route so any store reader (and the
  // openHub intent) stays truthful; the URL remains the authority for rendering.
  useEffect(() => {
    useHubStore.getState().syncFromRoute(entity);
  }, [entity]);

  // Leaving the detail ends the session.
  useEffect(() => () => useHubStore.getState().close(), []);

  // Back walks real history (one entry per hop, router-owned). A detail reached
  // by a bare URL has no in-app previous entry, so fall back to the Browse
  // surface the entity is met on rather than dropping out of the app.
  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(entity ? hubOriginFor(entity.entityType) : "/learn");
  };

  return (
    <PageShell archetype="detail">
      <PageStack size="default">
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>
        </div>

        {entity ? (
          <LexicalHubRouter entity={entity} />
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
