/**
 * LibraryPage
 *
 * Library section — freeroam search + content browser with no phase gating.
 * Wireframe Section 1.1: Library at /library
 *
 * D1: Uses ContentBrowser with no phase gating (all content visible).
 *
 * Rework (§5): the page used to hand ContentBrowser a MOCK source and no click
 * handler, so every card rendered `role="button"` and did nothing — a library
 * you cannot open anything from. It now reads the real content APIs
 * (`features/library/services/libraryContentSource.ts`), opens the tapped
 * entity in the lexical hub (the peek — looking something up is never a
 * navigation), and declares its own <h1>. The item currently open in the hub
 * carries a non-colour "current" cue (check glyph + weight), not just a hue.
 */
import { ContentBrowser, PageHeader, PageShell, PageStack } from "shared/components";
import type { ContentItem } from "shared/components";
import { openHub } from "shared/hub-entry";
import { useHubStore } from "shared/store";
import { libraryContentSource, type LibraryItemMetadata } from "features/library";

export default function LibraryPage() {
  // The peek's current entity gives the grid its "open" cue.
  const currentEntity = useHubStore((s) => s.currentEntity);

  const handleItemClick = (item: ContentItem) => {
    const metadata = item.metadata as Partial<LibraryItemMetadata> | undefined;
    const entity = metadata?.entity;
    if (!entity) return;
    openHub(entity);
  };

  return (
    <PageShell archetype="list">
      <PageStack size="default">
        <PageHeader
          title="Library"
          description="Everything you can open — radicals, grammar patterns and idioms. Tap a card to look it up."
        />
        <ContentBrowser
          contentSource={libraryContentSource}
          defaultTab="all"
          // Phase is sequencing metadata only: the whole library is open
          // (the inert phase-lookalike tabs stay unlocked by passing the top
          // phase, exactly as before the rework).
          userPhase={4}
          onItemClick={handleItemClick}
          activeItemId={currentEntity?.entityId ?? null}
        />
      </PageStack>
    </PageShell>
  );
}
