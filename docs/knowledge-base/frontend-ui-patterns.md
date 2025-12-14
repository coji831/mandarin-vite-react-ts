# UI & Component Patterns

**Category:** Frontend Development  
**Last Updated:** December 9, 2025

---

## Card-Based UI with CSS Grid

**When Adopted:** Epic 5 (Vocabulary List UI Enhancement)  
**Why:** Display many items compactly, responsive layout  
**Use Case:** Vocabulary lists, dashboards, galleries

### Minimal Example

```tsx
// 1. Card component
interface CardProps {
  title: string;
  subtitle?: string;
  metadata: { label: string; value: string }[];
  onClick?: () => void;
}

function Card({ title, subtitle, metadata, onClick }: CardProps) {
  return (
    <div
      className="card"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <h3>{title}</h3>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      <div className="metadata">
        {metadata.map(({ label, value }) => (
          <span key={label}>
            <strong>{label}:</strong> {value}
          </span>
        ))}
      </div>
    </div>
  );
}

// 2. CSS Grid layout
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card .metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

// 3. Usage
function VocabularyLists({ lists }: { lists: List[] }) {
  return (
    <div className="card-grid">
      {lists.map(list => (
        <Card
          key={list.id}
          title={list.name}
          subtitle={list.description}
          metadata={[
            { label: 'Words', value: list.wordCount.toString() },
            { label: 'Level', value: list.level },
          ]}
          onClick={() => navigate(`/list/${list.id}`)}
        />
      ))}
    </div>
  );
}
```

### Key Lessons

- `auto-fill` + `minmax()` for responsive grids
- Use semantic HTML (`role`, `tabIndex` for accessibility)
- Hover states for visual feedback
- Keep card height consistent with `align-items: start`

### When to Use

Lists of items, dashboards, galleries, product catalogs

---

## Client-Side Search & Filter

**When Adopted:** Epic 5 (Vocabulary List UI Enhancement)  
**Why:** Instant filtering, no server calls  
**Use Case:** Filtering lists, search bars

### Minimal Example

```tsx
// 1. Search state and logic
function useSearch<T>(items: T[], searchKeys: (keyof T)[]) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [items, query, searchKeys]);

  return { query, setQuery, filtered };
}

// 2. Filter by tags/categories
function useFilters<T>(items: T[]) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filtered = useMemo(() => {
    return items.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true; // Empty filter
        return item[key as keyof T] === value;
      });
    });
  }, [items, filters]);

  return { filters, setFilters, filtered };
}

// 3. Combined usage
function VocabularyListPage() {
  const lists = useLists();

  // Search
  const { query, setQuery, filtered: searched } = useSearch(lists, ["name", "description"]);

  // Filter
  const { filters, setFilters, filtered: results } = useFilters(searched);

  return (
    <div>
      <input
        type="text"
        placeholder="Search lists..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <select onChange={(e) => setFilters({ level: e.target.value })}>
        <option value="">All Levels</option>
        <option value="HSK1">HSK 1</option>
        <option value="HSK2">HSK 2</option>
      </select>

      <div className="results">{results.length} lists found</div>

      <CardGrid items={results} />
    </div>
  );
}
```

### Key Lessons

- Use `useMemo` to avoid re-filtering on every render
- Case-insensitive search (`toLowerCase()`)
- Combine search + filters sequentially
- Show results count for UX

### When to Use

Small-to-medium datasets (<1000 items), instant feedback needed

---

## Responsive Design with Tailwind-like Classes

**When Adopted:** Epic 5 (Vocabulary List UI Enhancement)  
**Why:** Mobile-first design, easy breakpoints  
**Use Case:** Layouts that adapt to screen size

### Minimal Example

```tsx
// 1. Mobile-first approach
function ResponsiveLayout() {
  return (
    <div
      className="
      grid 
      grid-cols-1        /* Mobile: 1 column */
      md:grid-cols-2     /* Tablet: 2 columns */
      lg:grid-cols-3     /* Desktop: 3 columns */
      gap-4
      p-4
      md:p-6             /* More padding on larger screens */
    "
    >
      {items.map((item) => (
        <Card key={item.id} {...item} />
      ))}
    </div>
  );
}

// 2. Hide/show elements by breakpoint
function Navigation() {
  return (
    <nav>
      {/* Mobile menu button */}
      <button className="md:hidden">Menu</button>

      {/* Desktop links */}
      <ul className="hidden md:flex gap-4">
        <li>
          <a href="/home">Home</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
      </ul>
    </nav>
  );
}

// 3. Responsive text sizes
function Title() {
  return (
    <h1
      className="
      text-2xl       /* Mobile */
      md:text-3xl    /* Tablet */
      lg:text-4xl    /* Desktop */
      font-bold
    "
    >
      Welcome
    </h1>
  );
}
```

### Breakpoints

```css
/* Default breakpoints (adjust for project) */
sm: 640px   /* Phone landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape / small desktop */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

### Key Lessons

- Design mobile-first (base styles, then add breakpoints)
- Use `hidden` / `flex` to toggle elements
- Test on real devices (Chrome DevTools not enough)
- Avoid horizontal scroll (`overflow-x-hidden`)

### When to Use

All projects (mobile traffic is 60%+ of web)

---

**Related Guides:**

- [React Patterns](./frontend-react-patterns.md) — Component basics
- [State Management](./frontend-state-management.md) — Data handling
