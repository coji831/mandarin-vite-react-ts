/**
 * @file entityHubRegistry.ts
 * @description Exhaustive Record-based registry mapping EntityType to lazy-loaded hub components.
 * Story 21.4: Reading UI + LexicalHub Phase 1 — routing refactor
 *
 * Each entry implements EntityHubProps (entityId, entityLabel).
 * Lazy-loaded via React.lazy() for code-splitting — Suspense boundary in LexicalHubRouter.
 */

import { lazy, type ComponentType } from "react";
import type { EntityType } from "shared/types";
import { Box } from "shared/components";

export interface EntityHubProps {
  entityId: string;
  entityLabel?: string | null;
}

type HubRegistry = { [K in EntityType]: ComponentType<EntityHubProps> };

const NotImplemented: ComponentType<EntityHubProps> = () => (
  <Box variant="card" padding="md" className="flex-center">
    <p className="font-sm text-tertiary m-0">Detail coming in a future story.</p>
  </Box>
);

export const entityHubRegistry: HubRegistry = {
  character: lazy(() =>
    import("features/character-hub").then((m) => ({
      default: m.CharacterHub,
    })),
  ),
  word: lazy(() =>
    import("features/word-hub").then((m) => ({
      default: m.WordHub,
    })),
  ),
  radical: lazy(() =>
    import("features/radicals").then((m) => ({
      default: m.RadicalHub,
    })),
  ),
  chengyu: lazy(() =>
    import("features/chengyu").then((m) => ({
      default: m.ChengyuHub,
    })),
  ),
  grammar: lazy(() =>
    import("features/grammar").then((m) => ({
      default: m.GrammarHub,
    })),
  ),
  phoneticCluster: NotImplemented,
};
