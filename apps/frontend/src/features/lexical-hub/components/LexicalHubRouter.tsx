/**
 * @file LexicalHubRouter.tsx
 * @description Pure routing layer — reads currentEntity from hubStore and delegates
 *              to the correct lazy-loaded hub component via entityHubRegistry.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Phase 3 — reads from hubStore
 * Story 21.4 (refactor): Exhaustive Record-based registry, pure routing
 *
 * Always reads currentEntity from hubStore. Storybook stories use withHubStore
 * decorator to pre-set entity state.
 */
import { Suspense } from "react";
import { Box, Button, Skeleton } from "shared/components";
import { useHubStore } from "shared/store";
import { entityHubRegistry } from "../entityHubRegistry";

export function LexicalHubRouter() {
  const { currentEntity, navigationStack } = useHubStore();
  const { entityType, entityId, label } = currentEntity ?? {};

  if (!entityType || !entityId) {
    return (
      <Box variant="card" padding="md">
        <p className="font-sm text-tertiary m-0">Select a character or word to view details.</p>
      </Box>
    );
  }

  const HubComponent = entityHubRegistry[entityType];

  return (
    <>
      {navigationStack.length > 0 && (
        <div className="lexical-hub__back-bar p-sm pb-none">
          <Button variant="ghost" size="sm" onClick={() => useHubStore.getState().back()}>
            ← Back
          </Button>
        </div>
      )}
      <Suspense
        fallback={<Skeleton variant="custom" width="100%" height="200px" className="radius-md" />}
      >
        <HubComponent entityId={entityId} entityLabel={label} />
      </Suspense>
    </>
  );
}
