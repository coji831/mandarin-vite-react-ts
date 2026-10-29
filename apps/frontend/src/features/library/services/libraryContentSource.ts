/**
 * @file services/libraryContentSource.ts
 * @description The Library's REAL `ContentSource` — replaces
 * `createMockContentSource()` on the production path (rework-proposal §5).
 *
 * There is no unified content endpoint, so this composes the three list APIs the
 * app already has — radicals (public), grammar patterns and chengyu idioms —
 * into ONE `ContentItem[]`, then filters and paginates in memory (the browser
 * owns the paging because the union spans three endpoints). Each item carries
 * the hub entity it opens in `metadata`, so a card click is a lookup, not a
 * navigation.
 *
 * Not included: readers (a passage opens the reading route, not the hub) and
 * foundations/phonetic clusters (no list endpoint exposes their cells). The
 * Library therefore shows exactly what it can open.
 */
import type { ContentItem, ContentSource, ContentType } from "shared/components";
import type { EntityType } from "shared/types";
import { radicalsService, type RadicalData } from "features/radicals";
import { grammarService } from "features/grammar";
import { chengyuService } from "features/chengyu";

/** The hub entity a card opens. */
export type LibraryEntityRef = {
  entityType: EntityType;
  entityId: string;
  label?: string;
};

/** `ContentItem` metadata contract — typed reader for the click handler. */
export type LibraryItemMetadata = {
  entity: LibraryEntityRef;
};

function radicalItems(radicals: RadicalData[]): ContentItem[] {
  return radicals.map((radical) => ({
    id: radical.id,
    contentType: "radical" as ContentType,
    title: radical.glyph,
    subtitle: radical.name_pinyin,
    translation: radical.meaning,
    // Phase is sequencing metadata, never a lock — every item is openable.
    phase: 2,
    metadata: {
      entity: {
        entityType: "radical",
        entityId: radical.id,
        label: `${radical.glyph} (${radical.name_pinyin})`,
      },
    } satisfies LibraryItemMetadata,
  }));
}

/**
 * Load every browsable item once, then serve filtered + paginated slices.
 * A failed endpoint degrades the Library to the sources that answered rather
 * than emptying it (`allSettled`).
 */
async function loadAll(): Promise<ContentItem[]> {
  const [radicals, grammar, chengyu] = await Promise.allSettled([
    radicalsService.loadAllRadicals(),
    grammarService.loadPatterns(),
    chengyuService.loadIdioms({ page: 1, pageSize: 100 }),
  ]);

  const items: ContentItem[] = [];

  if (radicals.status === "fulfilled") items.push(...radicalItems(radicals.value));

  if (grammar.status === "fulfilled") {
    items.push(
      ...grammar.value.map((pattern) => ({
        id: pattern.id,
        contentType: "grammar" as ContentType,
        title: pattern.name,
        subtitle: pattern.structure,
        translation: pattern.previewExample ?? undefined,
        hskLevel: pattern.hskLevel ?? undefined,
        phase: pattern.phase,
        metadata: {
          entity: {
            entityType: "grammar",
            entityId: pattern.id,
            label: pattern.name,
          },
        } satisfies LibraryItemMetadata,
      })),
    );
  }

  if (chengyu.status === "fulfilled") {
    items.push(
      ...chengyu.value.items.map((idiom) => ({
        id: idiom.id,
        contentType: "chengyu" as ContentType,
        title: idiom.chengyu,
        subtitle: idiom.pinyin,
        translation: idiom.literalMeaning,
        phase: 4,
        metadata: {
          entity: {
            entityType: "chengyu",
            entityId: idiom.id,
            label: idiom.chengyu,
          },
        } satisfies LibraryItemMetadata,
      })),
    );
  }

  return items;
}

let cache: Promise<ContentItem[]> | null = null;

/** Test/story helper — drop the in-memory aggregation. */
export function clearLibraryContentCache(): void {
  cache = null;
}

export const libraryContentSource: ContentSource = {
  async getItems({ contentType, searchQuery, hskLevel, phase, page, pageSize }) {
    if (!cache) cache = loadAll();
    const all = await cache;

    const query = searchQuery?.trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (contentType && item.contentType !== contentType) return false;
      if (hskLevel !== undefined && item.hskLevel !== hskLevel) return false;
      if (phase !== undefined && item.phase !== phase) return false;
      if (!query) return true;
      return [item.title, item.subtitle, item.translation]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query));
    });

    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total: filtered.length };
  },
};
