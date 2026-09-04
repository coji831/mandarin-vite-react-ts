---
purpose: Async progressive enrichment pattern
status: active
last-verified: 2026-09-03
type: guide
---

# Async Progressive Enrichment

**Category:** Frontend / React
**Last Updated:** September 3, 2026
**Difficulty:** Intermediate

> **Scope:** The lazy-enrichment pattern used in
> `apps/frontend/src/features/radicals/components/PhoneticFamilyNode.tsx` — rendering fast
> base data immediately and upgrading it with slower, per-item detail in the background.

---

## Problem

A list item has two kinds of data: **base data** that is cheap and available up front (the
phonetic family's glyph, pinyin, meaning, member count), and **enrichment data** that is
expensive to fetch (each member's `classification`, requiring one Characters-API call per
glyph). Blocking render on the enrichment would stall the UI; rendering nothing until it
arrives would show empty shells.

## Root Cause

- The Phonetic Clusters API (`GET /v1/phonetic-clusters`) returns families whose members have
  `classification: null`.
- Classification is populated by the Characters Module API (`GET /v1/characters/:glyph`) — a
  per-glyph request that is only worth making when the user actually expands a family.

## Solution

### 1. Keep base data always renderable

The component renders `family` (the base prop) at all times; enrichment is an overlay:

```tsx
const [enrichedFamily, setEnrichedFamily] = useState<PhoneticFamily | null>(null);
const enrichmentRef = useRef(false);

const displayFamily = enrichedFamily ?? family;
```

`displayFamily` falls back to the base data until enrichment completes — the collapse arrow,
glyph, pinyin, meaning, count, and member rows all render immediately.

### 2. Enrich only once, on first expand

A `useRef` guard (`enrichmentRef`) ensures the fetch runs exactly once, lazily, when the node
is expanded for the first time — not on mount and not on every re-render:

```tsx
useEffect(() => {
  if (isExpanded && !enrichmentRef.current) {
    enrichmentRef.current = true;
    enrichFamilyMembers(family)
      .then(setEnrichedFamily)
      .catch(() => {
        // Silently fail — classification badges simply won't show
        setEnrichedFamily(family);
      });
  }
}, [isExpanded, family]);
```

### 3. Per-glyph `Promise.all` with a silent per-item catch

`enrichFamilyMembers` fans out one request per member and merges results, degrading
per-item rather than failing the whole family:

```ts
export async function enrichFamilyMembers(family: PhoneticFamily): Promise<PhoneticFamily> {
  const enrichedMembers = await Promise.all(
    family.members.map(async (member) => {
      try {
        const charResponse = await apiClient.get(ROUTE_PATTERNS.charactersByGlyph(member.glyph), {
          timeout: 10000,
        });
        const charData = charResponse.data as { classification: string | null };
        return { ...member, classification: charData.classification ?? null };
      } catch {
        return { ...member, classification: null }; // badge omitted, row still renders
      }
    }),
  );
  return { ...family, members: enrichedMembers };
}
```

## Impact

- **Base display never blocks on network** — the tree renders instantly with full data, then
  classification badges appear when ready.
- **Per-item resilience** — a single failed glyph lookup degrades that one badge, not the
  whole family.
- **No wasted requests** — enrichment happens only for expanded nodes, once per node.

## Alternatives Considered

- **Eagerly fetch all classifications on load** — N×members requests for every family up
  front; wasteful when most nodes stay collapsed.
- **Blocking skeleton until enrichment** — worse UX and more states to maintain; contradicts
  the data-resilient shell principle.
- **Colocation of enrichment in a store/cache** — over-engineering for this scope; the
  ref-guarded effect is sufficient.

## See Also

- `apps/frontend/src/features/radicals/components/PhoneticFamilyNode.tsx` — the component.
- `apps/frontend/src/features/radicals/services/phoneticTreeService.ts` — the enrichment
  service (`enrichFamilyMembers`).
- `.github/instructions/frontend-input-handling.instructions.md` / the data-resilient shell
  principle in the visual-design protocol.
