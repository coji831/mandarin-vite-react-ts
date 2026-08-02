# Implementation 21-6: Phonetic Clusters

**Last Update:** July 29, 2026

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-6-phonetic-clusters.md`

## Technical Scope

Create the full DB-driven Phonetic Clusters feature: two new Prisma models (`PhoneticCluster` + `PhoneticClusterMember`), seed pipeline in `content/seed/phase2/`, dedicated `modules/phonetic-clusters/` backend module, `features/phonetic-clusters/` frontend feature with Storybook stories and MSW handlers, and route registration replacing the placeholder page.

**Total new files:** ~20+

**Files by layer:**

### Content / Seed

- `content/seed/phase2/phonetic-clusters.json` — **NEW**: curated cluster definitions
- `content/seed/phase2/phonetic-cluster-members.json` — **NEW**: cluster-to-character membership data
- `content/manifest.json` — update: add phonetic cluster entity counts

### Prisma / Database

- `apps/backend/prisma/schema.prisma` — update: add `PhoneticCluster` + `PhoneticClusterMember` models
- `apps/backend/prisma/seed.ts` — update: add Steps 15–16 (seed clusters + members)

### Backend — `modules/phonetic-clusters/`

- `apps/backend/src/modules/phonetic-clusters/container.ts` — **NEW**: DI registration
- `apps/backend/src/modules/phonetic-clusters/index.ts` — **NEW**: barrel export
- `apps/backend/src/modules/phonetic-clusters/api/PhoneticClustersController.ts` — **NEW**: REST controller
- `apps/backend/src/modules/phonetic-clusters/api/phoneticClustersRoutes.ts` — **NEW**: route definitions
- `apps/backend/src/modules/phonetic-clusters/services/PhoneticClustersService.ts` — **NEW**: business logic layer
- `apps/backend/src/modules/phonetic-clusters/repositories/PhoneticClustersRepository.ts` — **NEW**: Prisma query layer
- `apps/backend/src/modules/phonetic-clusters/types/phonetic-clusters.ts` — **NEW**: response types
- `apps/backend/src/modules/phonetic-clusters/types/phonetic-clusters-errors.ts` — **NEW**: error types
- `apps/backend/src/app/container.ts` — update: register phonetic clusters module
- `apps/backend/src/app/routes.ts` — update: wire phonetic clusters routes

### Shared Constants

- `packages/shared-constants/src/index.js` — update: add `ROUTE_PATTERNS.phoneticClusters` and `ROUTE_PATTERNS.phoneticClustersById`

### Frontend — `features/phonetic-clusters/`

- `apps/frontend/src/features/phonetic-clusters/index.ts` — **NEW**: barrel
- `apps/frontend/src/features/phonetic-clusters/components/PhoneticClustersContent.tsx` — **NEW**: main content component
- `apps/frontend/src/features/phonetic-clusters/components/PhoneticClustersContent.stories.tsx` — **NEW**: Storybook stories (all states)
- `apps/frontend/src/features/phonetic-clusters/components/ClusterCard.tsx` — **NEW**: cluster card
- `apps/frontend/src/features/phonetic-clusters/components/ClusterCard.stories.tsx` — **NEW**: Storybook stories
- `apps/frontend/src/features/phonetic-clusters/components/CharacterChip.tsx` — **NEW**: clickable character chip
- `apps/frontend/src/features/phonetic-clusters/components/CharacterChip.stories.tsx` — **NEW**: Storybook stories
- `apps/frontend/src/features/phonetic-clusters/services/phoneticClustersService.ts` — **NEW**: API service (uses apiClient + ROUTE_PATTERNS)
- `apps/frontend/src/features/phonetic-clusters/hooks/usePhoneticClusters.ts` — **NEW**: data hook (loading/error/filtering)
- `apps/frontend/src/features/phonetic-clusters/types/index.ts` — **NEW**: frontend types
- `apps/frontend/src/features/phonetic-clusters/__tests__/PhoneticClustersContent.test.tsx` — **NEW**: integration test

### Page + Routing

- `apps/frontend/src/pages/learn/phonetic-clusters/PhoneticClustersPage.tsx` — **NEW**: page container
- `apps/frontend/src/router/LearnRoutes.tsx` — update: replace `ContentPlaceholderPage` with `PhoneticClustersPage`

### Mocks

- `apps/frontend/src/mocks/handlers/phonetic-clusters-handlers.ts` — **NEW**: MSW handlers

## Implementation Details

### 1. Prisma Schema — New Models

Add two new models to `schema.prisma`:

```prisma
model PhoneticCluster {
  id               String   @id @default(cuid())
  componentId      String   @unique                // FK → Component.id
  displayOrder     Int
  description      String
  pronunciationNote String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  component        Component              @relation(fields: [componentId], references: [id])
  members          PhoneticClusterMember[]

  @@map("phonetic_clusters")
}

model PhoneticClusterMember {
  id            String @id @default(uuid())
  clusterId     String  // FK → PhoneticCluster.id
  characterId   String  // FK → Character.glyph
  sequenceOrder Int

  cluster   PhoneticCluster @relation(fields: [clusterId], references: [id], onDelete: Cascade)
  character Character       @relation(fields: [characterId], references: [glyph])

  @@unique([clusterId, characterId])
  @@map("phonetic_cluster_members")
}
```

**Dependency order:** Component (exists) → Character (exists) → PhoneticCluster (new) → PhoneticClusterMember (new)

### 2. Seed Pipeline

Two new seed files in `content/seed/phase2/`:

**`phonetic-clusters.json`:**

```json
[
  {
    "id": "pc_0001",
    "componentId": "comp_qing",
    "displayOrder": 1,
    "description": "Characters containing 青 as phonetic component",
    "pronunciationNote": "All characters share qing- onset but differ in tone"
  }
]
```

**`phonetic-cluster-members.json`:**

```json
[
  { "clusterId": "pc_0001", "characterId": "请", "sequenceOrder": 1 },
  { "clusterId": "pc_0001", "characterId": "情", "sequenceOrder": 2 },
  { "clusterId": "pc_0001", "characterId": "清", "sequenceOrder": 3 },
  { "clusterId": "pc_0001", "characterId": "晴", "sequenceOrder": 4 }
]
```

Add Steps 15–16 to `prisma/seed.ts`:

- **Step 15:** Upsert `PhoneticCluster` records from `phonetic-clusters.json`
- **Step 16:** Upsert `PhoneticClusterMember` records from `phonetic-cluster-members.json`

Update `content/manifest.json` with entity counts for the two new collections.

### 3. Backend Module — `modules/phonetic-clusters/`

**Module structure:**

```
modules/phonetic-clusters/
├── container.ts           — DI registration
├── index.ts               — barrel
├── api/
│   ├── PhoneticClustersController.ts
│   └── phoneticClustersRoutes.ts
├── services/
│   └── PhoneticClustersService.ts
├── repositories/
│   └── PhoneticClustersRepository.ts
└── types/
    ├── phonetic-clusters.ts
    └── phonetic-clusters-errors.ts
```

**Endpoints:**

| Method | Endpoint                    | Auth     | Description                                                                 |
| ------ | --------------------------- | -------- | --------------------------------------------------------------------------- |
| `GET`  | `/v1/phonetic-clusters`     | Optional | List all clusters. Optional `?hskLevel=N` filter. Sorted by `displayOrder`. |
| `GET`  | `/v1/phonetic-clusters/:id` | Optional | Single cluster detail with full member list. Returns 404 if not found.      |

**Response shape — `GET /v1/phonetic-clusters` (200):**

```json
{
  "data": [
    {
      "id": "pc_0001",
      "phoneticPattern": "青",
      "pinyin": "qīng",
      "phoneticPinyin": "qīng",
      "description": "Characters containing 青 as phonetic component",
      "pronunciationNote": "All characters share qing- onset but differ in tone",
      "memberCount": 4,
      "hskLevels": [1, 2],
      "members": [
        { "glyph": "请", "pinyin": "qǐng", "meaning": "please", "hskLevel": 1 },
        { "glyph": "情", "pinyin": "qíng", "meaning": "feeling", "hskLevel": 2 },
        { "glyph": "清", "pinyin": "qīng", "meaning": "clear", "hskLevel": 2 },
        { "glyph": "晴", "pinyin": "qíng", "meaning": "clear (weather)", "hskLevel": 2 }
      ]
    }
  ]
}
```

**Response shape — `GET /v1/phonetic-clusters/:id` (200):**

```json
{
  "data": {
    "id": "pc_0001",
    "phoneticPattern": "青",
    "pinyin": "qīng",
    "phoneticPinyin": "qīng",
    "description": "Characters containing 青 as phonetic component",
    "pronunciationNote": "All characters share qing- onset but differ in tone",
    "memberCount": 4,
    "hskLevels": [1, 2],
    "members": [
      { "glyph": "请", "pinyin": "qǐng", "meaning": "please", "hskLevel": 1 },
      { "glyph": "情", "pinyin": "qíng", "meaning": "feeling", "hskLevel": 2 },
      { "glyph": "清", "pinyin": "qīng", "meaning": "clear", "hskLevel": 2 },
      { "glyph": "晴", "pinyin": "qíng", "meaning": "clear (weather)", "hskLevel": 2 }
    ]
  }
}
```

**Error response — `GET /v1/phonetic-clusters/:id` (404):**

```json
{
  "error": "Phonetic cluster not found",
  "code": "PHONETIC_CLUSTER_NOT_FOUND"
}
```

**Repository queries:**

```typescript
async findAll(hskLevel?: number): Promise<...> {
  const where: Prisma.PhoneticClusterWhereInput = {};
  if (hskLevel) {
    where.members = {
      some: {
        character: {
          hskLevels: { some: { hskLevel: { level: hskLevel } } },
        },
      },
    };
  }
  return prisma.phoneticCluster.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
    include: {
      component: true,
      members: {
        orderBy: { sequenceOrder: 'asc' },
        include: {
          character: {
            include: { readings: true, hskLevels: { include: { hskLevel: true } } },
          },
        },
      },
    },
  });
}

async findById(id: string): Promise<... | null> {
  return prisma.phoneticCluster.findUnique({
    where: { id },
    include: { /* same as findAll */ },
  });
}
```

**Module registration:**

- In `container.ts`: import and register `PhoneticClustersModule`
- In `routes.ts`: `app.use('/v1/phonetic-clusters', phoneticClustersRoutes)`

### 4. Shared Constants

Add to `packages/shared-constants/src/index.js`:

```typescript
export const ROUTE_PATTERNS = {
  // ... existing routes
  phoneticClusters: "/v1/phonetic-clusters",
  phoneticClustersById: (id: string) => `/v1/phonetic-clusters/${id}`,
} as const;
```

### 5. Frontend Feature — `features/phonetic-clusters/`

**Component tree:**

```
PhoneticClustersPage
└── PhoneticClustersContent
    ├── HskFilterChips (FilterChip[])
    ├── [Loading] → Skeleton grid (5 cards with shimmer)
    ├── [Error] → ErrorScreen (title, message, onRetry)
    ├── [Empty] → "No phonetic clusters available yet"
    ├── [Filtered-Empty] → "No clusters for HSK N" + "Show all" button
    └── [Populated] → ClusterCardGrid
        └── ClusterCard (per cluster)
            ├── PhoneticPattern (glyph + pinyin)
            ├── Description
            ├── PronunciationNote (if present)
            ├── HskLevel badges
            └── CharacterChips
                └── CharacterChip (glyph + pinyin, onClick → openHub)
```

**Service layer:**

```typescript
import { apiClient } from "@/shared/lib/apiClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhoneticClusterResponse } from "../types";

export const phoneticClustersService = {
  async getAll(hskLevel?: number): Promise<PhoneticClusterResponse[]> {
    const params = hskLevel ? { hskLevel: String(hskLevel) } : {};
    const { data } = await apiClient.get(ROUTE_PATTERNS.phoneticClusters, { params });
    return data.data;
  },

  async getById(id: string): Promise<PhoneticClusterResponse> {
    const { data } = await apiClient.get(ROUTE_PATTERNS.phoneticClustersById(id));
    return data.data;
  },
};
```

**Hook (`usePhoneticClusters.ts`):**
Returns `{ clusters, isLoading, error, hskFilter, setHskFilter, retry }`. Fetches on mount and on hskFilter change. Loading state during fetch. Error caught from apiClient.

### 6. Page + Routing

**`PhoneticClustersPage.tsx`:** Page container that renders `PhoneticClustersContent`. Uses `usePageTitle`.

**`LearnRoutes.tsx` update:**

```tsx
// Replace:
//   <Route path="phonetic-clusters" element={<ContentPlaceholderPage title="Phonetic Clusters" />} />
// With:
//   <Route path="phonetic-clusters" element={<PhoneticClustersPage />} />
```

### 7. Key Behaviors

- **Data flow:** `apiClient` → `GET /v1/phonetic-clusters` — no static JSON consumed by frontend
- **HSK filter:** Implemented server-side — `GET /v1/phonetic-clusters?hskLevel=N` (`PhoneticClustersRepository.findAll(hskLevel)` filters clusters containing a character at that level); the frontend also filters the returned `hskLevels` arrays client-side as a secondary pass
- **Loading:** Skeleton grid (5 cards) with shimmer during API fetch
- **Error:** `ErrorScreen` with retry button
- **Empty:** "No phonetic clusters available yet" message
- **Filtered-empty:** "No clusters for HSK N" + "Show all" button
- **CharacterHub:** `openHub(characterId)` via existing Zustand store

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHONETIC CLUSTERS — DB-Driven                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Content Layer]                                                 │
│  └── content/seed/phase2/                                        │
│      ├── phonetic-clusters.json         (curated definitions)    │
│      └── phonetic-cluster-members.json  (membership data)        │
│                            │                                    │
│                            ▼                                    │
│  [Database]                                                      │
│  └── Prisma Schema                                               │
│      ├── Component (existing)                                    │
│      ├── Character (existing)                                    │
│      ├── PhoneticCluster (new) ──1:N──► PhoneticClusterMember   │
│      └── PhoneticClusterMember (new) ──N:1──► Character          │
│                            │                                    │
│                            ▼                                    │
│  [Backend]                                                       │
│  └── modules/phonetic-clusters/                                  │
│      ├── PhoneticClustersRepository  (Prisma queries)            │
│      ├── PhoneticClustersService     (orchestration)             │
│      ├── PhoneticClustersController  (Express handlers)          │
│      └── Routes: GET /v1/phonetic-clusters[?hskLevel=N]         │
│                  GET /v1/phonetic-clusters/:id                   │
│                            │                                    │
│                            ▼                                    │
│  [Frontend]                                                      │
│  └── features/phonetic-clusters/                                 │
│      ├── phoneticClustersService.ts  (apiClient → ROUTE_PATTERNS)│
│      ├── usePhoneticClusters.ts      (loading/error/filter)      │
│      └── components/                 (content, cards, chips)     │
│                            │                                    │
│                            ▼                                    │
│  [Integration]                                                   │
│  ├── CharacterHub via openHub()  (existing Zustand store)        │
│  ├── Learn Routes → /learn/phonetic-clusters                    │
│  └── Storybook → MSW handlers, stories for all states           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Dependency order:
  Component (exists) → Character (exists)
    → PhoneticCluster (new) → PhoneticClusterMember (new)
```

## Storybook

**MSW handlers (`mocks/handlers/phonetic-clusters-handlers.ts`):**

- `GET /v1/phonetic-clusters` — mock cluster data
- `GET /v1/phonetic-clusters?hskLevel=1` — filtered results
- `GET /v1/phonetic-clusters/:id` — single cluster
- Network error simulation (for error state stories)

**Stories for `PhoneticClustersContent`:**

- Loading — delayed response, skeleton visible
- Error — 500 response, ErrorScreen with retry
- Empty — `{ data: [] }`, empty state message
- Populated — 3+ clusters with members
- Filtered-Empty — HSK 6 filter, "Show all" button
- CharacterHub integration — `withHubStore` decorator

**Stories for `ClusterCard`:**

- Default — populated card with 4 members
- Minimal — 1 member, no pronunciationNote
- Long description — truncated text

**Stories for `CharacterChip`:**

- Default — glyph + pinyin
- Active/focused state
- Accessed via keyboard

## Technical Challenges & Solutions

```
Problem: Existing Component + CharacterComponent tables have phonetic data
         but no curated cluster groupings with metadata.
Solution: Create PhoneticCluster + PhoneticClusterMember as additive models.
         No migration changes needed on existing tables.

Problem: 100+ existing phonetic-component links exist but no curated cluster
         groupings — Component model identifies pronunciation hints per
         character, not family groupings.
Solution: Seed data is hand-curated for pedagogical value (HSK 1-2 focus).
         Existing CharacterComponent phonetic links aid future expansion.

Problem: Story was originally designed as static JSON — full pivot to DB-driven
         required schema, backend module, and seed pipeline.
Solution: All-in-DB architecture applies uniformly. Seed files are sources only.
         Production reads go through Prisma via REST API.
```

## Testing

**Backend unit tests (`PhoneticClustersService.test.ts`):**

- `findAll` returns all clusters (no filter)
- `findAll` with `hskLevel` filter returns only matching clusters
- `findAll` with non-matching `hskLevel` returns empty array
- `findById` returns cluster with members
- `findById` with nonexistent ID returns null

**Frontend tests (`PhoneticClustersContent.test.tsx`):**

- Renders skeleton while loading
- Renders ErrorScreen on API error; retry re-fetches
- Renders empty state when API returns zero clusters
- Renders clusters when API returns data
- Filter pills visible and functional
- Filtered-empty shows "Show all" button
- Clicking CharacterChip calls openHub with correct characterId

### Doc Truth-Check (Verify Against Code)
- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
