/**
 * @file LexicalHubRouter.tsx
 * @description Pure routing layer — picks the hub component for an entity and
 *              renders it via entityHubRegistry.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.4 (refactor): Exhaustive Record-based registry, pure routing
 * S2 (session = route): the routed LexicalEntityPage passes the entity it read
 *   from the URL, so the rendered session always matches the address bar. The
 *   hubStore fallback keeps Storybook stories working (they preset the store
 *   via withHubStore) and is never the source of truth in the app.
 */
import { Suspense } from "react";
import { Box, Skeleton } from "shared/components";
import { useHubStore } from "shared/store";
import type { EntityRef } from "shared/types";
import { entityHubRegistry } from "../entityHubRegistry";

export type LexicalHubRouterProps = {
  /** Entity to render — supplied by the route. Falls back to hubStore. */
  entity?: EntityRef | null;
};

export function LexicalHubRouter({ entity }: LexicalHubRouterProps = {}) {
  const storeEntity = useHubStore((s) => s.currentEntity);
  const { entityType, entityId, label } = entity ?? storeEntity ?? {};

  if (!entityType || !entityId) {
    return (
      <Box variant="card" padding="md">
        <p className="font-sm text-tertiary m-0">Select a character or word to view details.</p>
      </Box>
    );
  }

  const HubComponent = entityHubRegistry[entityType];

  return (
    <Suspense
      fallback={<Skeleton variant="custom" width="100%" height="200px" className="radius-md" />}
    >
      <HubComponent entityId={entityId} entityLabel={label} />
    </Suspense>
  );
}
