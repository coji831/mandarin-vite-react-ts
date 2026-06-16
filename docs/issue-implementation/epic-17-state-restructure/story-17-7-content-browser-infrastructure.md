# Implementation 17-7: Content Browser Infrastructure

## Technical Scope

**Files to create:**

- `apps/frontend/src/shared/components/ContentBrowser/ContentCard.tsx`
- `apps/frontend/src/shared/components/ContentBrowser/ContentGrid.tsx`
- `apps/frontend/src/shared/components/ContentBrowser/SearchBar.tsx`
- `apps/frontend/src/shared/components/ContentBrowser/FilterDropdown.tsx`
- `apps/frontend/src/shared/components/ContentBrowser/TabBar.tsx`
- `apps/frontend/src/shared/components/ContentBrowser/types.ts`
- `apps/frontend/src/shared/components/ContentBrowser/index.ts`
- `apps/frontend/src/shared/components/ContentBrowser/ContentBrowser.tsx` — main composition component
- `apps/frontend/src/shared/components/ContentBrowser/__tests__/` — test files

**Files to modify:**

- `apps/frontend/src/shared/components/index.ts` — add ContentBrowser export
- `apps/frontend/src/pages/LearnPage.tsx` (or equivalent) — use ContentBrowser
- `apps/frontend/src/constants/paths.ts` — add/update route constants
- `apps/frontend/src/router/index.tsx` — add redirect `/learn/vocabulary-list` → `/learn`

**Files to delete:**

- `apps/frontend/src/pages/VocabularyListPage.tsx` (or equivalent)

## Implementation Details

### Step 1: Define Shared Types

```typescript
// ContentBrowser/types.ts
export type ContentType = "vocabulary" | "radical" | "phonetic" | "reader" | "grammar" | "chengyu";

export interface ContentItem {
  id: string;
  contentType: ContentType;
  title: string; // Main display text (Chinese)
  subtitle?: string; // Secondary text (pinyin)
  translation?: string; // English translation
  hskLevel?: number; // 1-6
  phase: number; // 1-4 (content unlock phase)
  isLocked?: boolean; // Phase-gated
  metadata?: Record<string, unknown>; // Type-specific data
}

export interface ContentSource {
  getItems: (params: {
    contentType?: ContentType;
    searchQuery?: string;
    hskLevel?: number;
    phase?: number;
    page: number;
    pageSize: number;
  }) => Promise<{ items: ContentItem[]; total: number }>;
}

export type TabDefinition = {
  id: ContentType | "all";
  label: string;
  icon: string;
};

export const CONTENT_TABS: TabDefinition[] = [
  { id: "all", label: "All", icon: "📋" },
  { id: "vocabulary", label: "Foundations", icon: "🔤" },
  { id: "radical", label: "Radicals", icon: "📘" },
  { id: "phonetic", label: "Phonetic", icon: "🔊" },
  { id: "reader", label: "Readers", icon: "📖" },
  { id: "grammar", label: "Grammar", icon: "📕" },
  { id: "chengyu", label: "Chengyu", icon: "🏮" },
];
```

### Step 2: Build `ContentCard.tsx`

```typescript
// ContentBrowser/ContentCard.tsx
interface ContentCardProps {
  item: ContentItem;
  onClick?: (item: ContentItem) => void;
}

const TYPE_ICONS: Record<ContentType, string> = {
  vocabulary: "🔤",
  radical: "📘",
  phonetic: "🔊",
  reader: "📖",
  grammar: "📕",
  chengyu: "🏮",
};

export function ContentCard({ item, onClick }: ContentCardProps) {
  return (
    <div
      className={`content-card ${item.isLocked ? "content-card--locked" : ""}`}
      onClick={() => !item.isLocked && onClick?.(item)}
      role="button"
      tabIndex={item.isLocked ? -1 : 0}
      aria-label={`${item.title}${item.isLocked ? " (locked)" : ""}`}
    >
      {item.isLocked && <span className="content-card__lock-badge">🔒</span>}
      <span className="content-card__type-badge">
        {TYPE_ICONS[item.contentType]}
      </span>
      <div className="content-card__content">
        <h3 className="content-card__title">{item.title}</h3>
        {item.subtitle && <p className="content-card__subtitle">{item.subtitle}</p>}
        {item.translation && <p className="content-card__translation">{item.translation}</p>}
      </div>
      {item.hskLevel && (
        <span className="content-card__hsk">HSK {item.hskLevel}</span>
      )}
    </div>
  );
}
```

### Step 3: Build `ContentGrid.tsx`

```typescript
// ContentBrowser/ContentGrid.tsx
interface ContentGridProps {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onItemClick: (item: ContentItem) => void;
  isLoading?: boolean;
}

export function ContentGrid({ items, total, page, pageSize, onPageChange, onItemClick, isLoading }: ContentGridProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="content-grid">
      {isLoading ? (
        <div className="content-grid__loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="content-grid__empty">No content found</div>
      ) : (
        <>
          <div className="content-grid__cards">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} onClick={onItemClick} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="content-grid__pagination">
              <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Step 4: Build `SearchBar.tsx`

```typescript
// ContentBrowser/SearchBar.tsx
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search Chinese, pinyin, or English..." }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(newValue), 300);
  };

  return (
    <div className="content-search-bar">
      <span className="content-search-bar__icon">🔍</span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search content"
        className="content-search-bar__input"
      />
      {localValue && (
        <button
          className="content-search-bar__clear"
          onClick={() => handleChange("")}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

### Step 5: Build `FilterDropdown.tsx`

```typescript
// ContentBrowser/FilterDropdown.tsx
interface FilterDropdownProps {
  label: string;
  value: string | number | undefined;
  options: Array<{ value: string | number; label: string }>;
  onChange: (value: string | number | undefined) => void;
}

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  return (
    <div className="content-filter-dropdown">
      <label>{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : val);
        }}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
```

### Step 6: Build `TabBar.tsx`

```typescript
// ContentBrowser/TabBar.tsx
import { CONTENT_TABS, ContentType } from "./types";

interface TabBarProps {
  activeTab: ContentType | "all";
  onTabChange: (tab: ContentType | "all") => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="content-tab-bar" role="tablist">
      {CONTENT_TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`content-tab-bar__tab ${activeTab === tab.id ? "content-tab-bar__tab--active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

### Step 7: Compose `ContentBrowser.tsx`

```typescript
// ContentBrowser/ContentBrowser.tsx
import { useState, useMemo } from "react";
import { TabBar } from "./TabBar";
import { SearchBar } from "./SearchBar";
import { FilterDropdown } from "./FilterDropdown";
import { ContentGrid } from "./ContentGrid";
import { ContentItem, ContentType } from "./types";

// Temporary: vocabulary data source (will be replaced by ContentSource in future stories)
import { loadCsvVocab } from "../../features/vocabulary/utils";
const vocabData = loadCsvVocab();

const HSK_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `HSK ${n}` }));
const PHASE_OPTIONS = [1, 2, 3, 4].map((n) => ({ value: n, label: `Phase ${n}` }));

export function ContentBrowser() {
  const [activeTab, setActiveTab] = useState<ContentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hskLevel, setHskLevel] = useState<number | undefined>();
  const [phase, setPhase] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter and paginate data
  const filteredItems = useMemo(() => {
    let items = vocabData.map(/* ...transform to ContentItem... */);

    if (activeTab !== "all") {
      items = items.filter((i) => i.contentType === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q) ||
               i.subtitle?.toLowerCase().includes(q) ||
               i.translation?.toLowerCase().includes(q)
      );
    }
    if (hskLevel) items = items.filter((i) => i.hskLevel === hskLevel);
    if (phase) items = items.filter((i) => i.phase === phase);

    return items;
  }, [activeTab, searchQuery, hskLevel, phase]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="content-browser">
      <TabBar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setPage(1); }} />
      <div className="content-browser__controls">
        <SearchBar value={searchQuery} onChange={(q) => { setSearchQuery(q); setPage(1); }} />
        <FilterDropdown label="HSK Level" value={hskLevel} options={HSK_OPTIONS} onChange={(v) => { setHskLevel(v as number | undefined); setPage(1); }} />
        <FilterDropdown label="Phase" value={phase} options={PHASE_OPTIONS} onChange={(v) => { setPhase(v as number | undefined); setPage(1); }} />
      </div>
      <ContentGrid
        items={paginatedItems}
        total={filteredItems.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onItemClick={(item) => {/* Navigate to item detail */}}
      />
    </div>
  );
}
```

### Step 8: Route Redirect

In `apps/frontend/src/router/index.tsx`:

```typescript
// Replace /learn/vocabulary-list route with redirect
{
  path: "/learn/vocabulary-list",
  element: <Navigate to="/learn" replace />,
}
```

## Architecture Integration

```
Before:
  /learn/vocabulary-list → VocabularyListPage (vocabulary-only)

After:
  /learn → ContentBrowser (all content types, vocabulary tab active by default)
  /learn/vocabulary-list → redirect to /learn

ContentBrowser data flow:
  URL params (tab, search, hsk, phase, page)
    → ContentBrowser state
      → filters + paginates data
        → ContentGrid → ContentCard[]
```

## Technical Challenges & Solutions

```
Problem: ContentBrowser needs data from multiple feature sources, but can't import feature internals
Solution: Define a ContentSource interface. Each feature provides its data through this interface.
The ContentBrowser only depends on the interface, not on feature implementations.

Problem: vocabulary list had its own page with specific layout
Solution: Build ContentBrowser to match the existing vocabulary list UX first (pagination, HSK filter),
then add new features (type tabs, search, phase filter). Existing users see familiar layout.
```

## Testing Implementation

- Test `ContentCard` renders correct badge for each content type
- Test `ContentGrid` pagination (first/last page, edge cases)
- Test `SearchBar` debounce behavior
- Test `TabBar` active tab highlighting
- Test `FilterDropdown` select/deselect behavior
- Test `ContentBrowser` integration: filter combination + pagination
