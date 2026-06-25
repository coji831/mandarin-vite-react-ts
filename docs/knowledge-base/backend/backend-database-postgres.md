# PostgreSQL Setup & Migrations

**Last Updated:** June 2, 2026

**When Adopted:** Epic 13

## Why

Production-grade, scalable, and reliable relational database for multi-user backend.

## Use Case

- Persistent user data
- Cross-device sync
- Advanced queries

## Steps

1. **Install PostgreSQL** (local or cloud)
2. **Set DATABASE_URL** in `.env`
3. **Edit `prisma/schema.prisma`** for your models
4. **Run migrations:**
   ```sh
   npx prisma migrate dev --name init
   # For production:
   npx prisma migrate deploy
   ```
5. **Use Prisma Client** in your code

## Minimal Example

```prisma
// schema.prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

## Key Lessons

- Always use migrations, not manual SQL
- Use environment variables for secrets
- Back up your DB before major changes
- **Configure connection pools for cloud providers** (prevent ECONNRESET)
- **Use transaction pooling for serverless** (Vercel, Netlify functions)
- **Set idle timeout lower than provider timeout** (avoid dead connections)

## Connection Stability & Pooling

**When Adopted:** Epic 13 Story 13.3  
**Why:** Prevent ECONNRESET/ECONNREFUSED errors from cloud database timeouts  
**Use Case:** Production deployments, long-running development servers

### Problem: Idle Connection Timeouts

Cloud database providers (Supabase, Railway, Neon) close idle connections after 10-15 minutes. Prisma may attempt to reuse closed connections, causing errors.

**Symptoms:**

- ECONNRESET errors after idle periods
- "Connection terminated unexpectedly"
- Works fine after server restart
- Errors occur >10min after last database query

### Solution: Connection Pool Configuration

```javascript
// apps/backend/src/infrastructure/database/client.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],

  // Connection pool configuration (Supabase/cloud providers)
  pool: {
    max: 10, // Maximum pool size
    min: 2, // Minimum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s (before provider timeout)
    connectionTimeoutMillis: 10000, // Fail fast if can't acquire connection
    keepAlive: true, // TCP keep-alive packets
    keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10s
  },
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
```

**Configuration Rationale:**

- `idleTimeoutMillis: 30000` — Close connections before provider timeout (10min)
- `connectionTimeoutMillis: 10000` — Fail fast if pool exhausted
- `keepAlive: true` — Detect dead connections early
- `max: 10` — Leave headroom in provider limits (e.g., Supabase 50 connections)

### Diagnosing Connection Issues

**Check 1: Verify connection string**

```bash
# Print DATABASE_URL (hide password)
echo $env:DATABASE_URL -replace ':[^@]+@', ':***@'
```

**Check 2: Test raw connection**

```bash
# Using psql
psql "$DATABASE_URL"

# Using Prisma
npx prisma db pull
```

**Check 3: Monitor connection count**

```sql
-- Run in Supabase SQL Editor or psql
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'postgres';
```

**Check 4: Review provider logs**

- Supabase: Dashboard → Logs → Postgres Logs
- Railway: Project → Logs
- Look for: connection closed, idle timeout, max connections

## When to Use

- Production, staging, or persistent dev environments
- All cloud-hosted PostgreSQL (Supabase, Railway, Neon)
- Serverless functions (Vercel, Netlify)
- Development servers running >10min

## Data Migration Strategies & ID Generation

**When Adopted:** Epic 15 Story 15.2  
**Why:** Migration from CSV/flat files to normalized database requires careful ID strategy  
**Use Case:** Importing existing data, CSV migrations, referential integrity

### ID Generation Strategy Decision Matrix

When migrating data from external sources (CSV, JSON, APIs), choosing the right ID strategy affects debugging, performance, and maintainability.

| Strategy               | Pros                                | Cons                                      | Use When                              |
| ---------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------- |
| **CSV Row Number**     | Simple, transparent, easy debugging | Not globally unique, breaks on reordering | Single-source import, debugging phase |
| **Hash (pinyin+name)** | Deterministic, survives reordering  | Encoding issues, hard to debug            | Stable unique identifiers needed      |
| **UUID**               | Globally unique, no collisions      | Not human-readable, harder to debug       | Production, distributed systems       |
| **Auto-increment**     | Database-managed, guaranteed unique | Loses referential integrity on re-import  | New data only, no external references |

### Challenge: Hash-Based IDs with CSV Sources

**Problem:** Computing hash from source data (e.g., SHA256 of pinyin+simplified Chinese) can fail due to:

- **Unicode normalization differences** (NFC vs NFD)
- **Encoding inconsistencies** (UTF-8 BOM, different line endings)
- **Character variations** (combining vs precomposed diacritics: `bā` vs `ba\u0304`)
- **Whitespace handling** (trim, normalize spaces differently)

**Example Failure:**

```javascript
// Batch CSV: 八,bā,eight (UTF-8 with BOM)
const hash1 = crypto.createHash("sha256").update("bā_八").digest("hex").substring(0, 16);
// → "a1b2c3d4e5f6..."

// Thematic CSV: 八,bā,eight (UTF-8 without BOM)
const hash2 = crypto.createHash("sha256").update("bā_八").digest("hex").substring(0, 16);
// → "x9y8z7w6v5u4..." (different hash!)
```

**Result:** Thematic categorization references word by hash, but computed hash differs → orphaned reference.

**Solution Options:**

1. **Use source row number as ID (debugging phase):**

   ```javascript
   // CSV row #3 → VocabularyWord.id = "3"
   const word = {
     id: row.No, // Direct from CSV
     pinyin: row.Pinyin,
     simplified: row.Chinese,
   };
   ```

   **Benefits:**
   - 100% transparent: ID "3" maps to row 3 in source CSV
   - Easy debugging: see which word #464 failed immediately
   - No encoding issues: no computation needed
   - Perfect match rate: references use same ID format

   **Trade-offs:**
   - Not globally unique (multiple CSVs will have row 1-500)
   - Must migrate to UUID/hash before multi-source support
   - IDs reveal internal data structure

2. **Normalize before hashing (production phase):**

   ```javascript
   function generateStableId(pinyin, simplified) {
     // Normalize Unicode to NFC form
     const normalizedPinyin = pinyin.normalize("NFC").toLowerCase().trim();
     const normalizedChinese = simplified.normalize("NFC").trim();

     const input = `${normalizedPinyin}_${normalizedChinese}`;
     return crypto.createHash("sha256").update(input, "utf8").digest("hex").substring(0, 16);
   }
   ```

   **Benefits:**
   - Deterministic: same input always produces same hash
   - Survives CSV reordering or different sources
   - No collisions with proper hash length

   **Requires:**
   - Consistent encoding handling across all data sources
   - Validation: test hash generation on sample data before migration
   - Fallback: provide manual ID mapping for edge cases

### Migration Performance: Batch Operations

**Problem:** Migrating 500+ words with many-to-many relationships (categories, lists) requires many database writes.

**Anti-pattern: Individual upserts**

```javascript
// Slow: 624 database round-trips for word-category links
for (const word of thematicWords) {
  await prisma.wordCategory.upsert({
    where: { wordId_categoryId: { wordId: word.id, categoryId } },
    update: {},
    create: { wordId: word.id, categoryId },
  });
}
// Result: ~60 seconds for 624 links
```

**Best Practice: Batch operations**

```javascript
// Fast: Single database round-trip with batch insert
const linksToCreate = thematicWords.map((word) => ({
  wordId: word.id,
  categoryId,
}));

await prisma.wordCategory.createMany({
  data: linksToCreate,
  skipDuplicates: true, // Ignore conflicts on composite key
});
// Result: ~2 seconds for 624 links (30x faster)
```

**Performance Comparison:**

- Individual upserts: 624 operations × ~100ms = 60 seconds
- Batch createMany: 1 operation = 2 seconds
- **Result: 30x performance improvement**

**When to use:**

- ✅ Use `createMany` for bulk inserts (new records only)
- ✅ Use `upsert` when updates possible (idempotent migrations)
- ✅ Prepare data in memory, then single batch write
- ❌ Avoid loops with await inside for database operations

### Normalized Schema Migration Pattern

**Pattern: Separate data sources by purpose**

When migrating to normalized schema (multiple tables, junction tables), use different source files for different purposes:

```
Canonical Source (batch CSVs)
  ↓
Primary entity table (VocabularyWord)
  ↓
Reference tables use primary entity IDs
  ↓
Thematic/categorization files → Junction tables (WordCategory)
```

**Example Structure:**

```bash
# Canonical word sources (no overlaps)
batch-001-100.csv  → VocabularyWord table (100 words)
batch-101-200.csv  → VocabularyWord table (100 words)

# Categorization (references word IDs, allows overlaps)
thematic-daily-communication.csv → WordCategory table (references existing word IDs)
thematic-food-dining.csv         → WordCategory table (references existing word IDs)
```

**Migration Order:**

1. Create primary entities (words) from canonical sources
2. Create reference entities (categories) as needed
3. Create junction table links (word-category), validating foreign keys
4. Report orphaned references (IDs in thematic files not found in word table)

**Benefits:**

- Clear data ownership: canonical sources define entities
- No duplicate entities from multiple sources
- Flexible categorization: same word in multiple categories
- Easy validation: check orphaned references to find data issues

### Debugging Migration Issues

**Check 1: Compare source and target counts**

```sql
-- Expected: 500 words from 5 batch CSVs
SELECT COUNT(*) FROM VocabularyWord;

-- Expected: 624 links from 7 thematic CSVs (some overlap)
SELECT COUNT(*) FROM WordCategory;
```

**Check 2: Find orphaned references**

```javascript
// In migration script: track IDs that don't map
const orphanedIds = [];
for (const thematicWord of thematicWords) {
  const exists = await prisma.vocabularyWord.findUnique({
    where: { id: thematicWord.id },
  });
  if (!exists) {
    orphanedIds.push({ id: thematicWord.id, word: thematicWord });
  }
}
console.log(`Orphaned references: ${orphanedIds.length}`);
orphanedIds.slice(0, 5).forEach((ref) => console.log(`Missing: #${ref.id} ${ref.word.simplified}`));
```

**Check 3: Validate ID format consistency**

```javascript
// Ensure all IDs use same format (string/number, padding, etc.)
const sample = await prisma.vocabularyWord.findMany({ take: 5, select: { id: true } });
console.log(
  "Sample IDs:",
  sample.map((w) => w.id),
);
// Expected: ["1", "2", "3", "4", "5"] (consistent format)
```

## Prisma Relations: Service Design & Testing Considerations

**When Adopted:** Epic 15 Story 15.2  
**Why:** Understanding how Prisma handles nested relations prevents service bugs and test failures  
**Use Case:** Services that enrich data from multiple tables, testing services with ORM mocks

### Nested Relations Structure

Prisma automatically includes nested relation objects when you use `include` in queries. This affects:

1. **Service response shape** - Return values contain nested objects, not flat data
2. **Test mock structure** - Mocks must match the exact nested structure
3. **Data mapping logic** - Services must navigate nested structures correctly

**Example: WordCategory Junction Table**

```javascript
// Query with nested relations
const words = await prisma.vocabularyWord.findMany({
  include: {
    categories: {
      include: {
        category: true, // Include full Category object
      },
    },
  },
});

// Result structure
{
  id: "1",
  simplified: "你好",
  traditional: "你好",
  pinyin: "nǐ hǎo",
  english: "hello",
  categories: [
    {
      wordId: "1",
      categoryId: "cat1",
      category: {          // Nested Category object
        id: "cat1",
        name: "Greetings",
        slug: "greetings"
      }
    },
    {
      wordId: "1",
      categoryId: "cat2",
      category: {
        id: "cat2",
        name: "Daily Communication",
        slug: "daily-communication"
      }
    }
  ]
}
```

### Service Pattern: Relationship Mapping

When enriching data for API responses, map nested structures correctly:

```javascript
// ❌ Wrong: Assumes flat array of IDs
const categories = word.categories; // Returns junction objects, not category IDs

// ✅ Correct: Navigate nested structure
const categories = word.categories?.map((wc) => wc.category?.name).filter(Boolean) || [];
// Result: ["Greetings", "Daily Communication"]
```

**Alternative: Flatten at query level** (more efficient)

```javascript
const words = await prisma.vocabularyWord.findMany({
  select: {
    id: true,
    simplified: true,
    categories: {
      select: {
        category: {
          select: { name: true },
        },
      },
    },
  },
});
```

### Testing: Mock Structure Requirements

**Problem:** Tests fail with "Cannot read property 'name' of undefined" when mocks don't match Prisma structure.

```javascript
// ❌ Wrong: Flat mock doesn't match Prisma structure
const mockVocab = [
  {
    id: "1",
    simplified: "你好",
    categories: ["Greetings", "Daily Communication"], // Flat array
  },
];

// ✅ Correct: Nested mock matches Prisma structure
const mockVocab = [
  {
    id: "1",
    simplified: "你好",
    categories: [
      { category: { name: "Greetings" } }, // Junction with nested Category
      { category: { name: "Daily Communication" } },
    ],
  },
];
```

**Test Pattern:**

```javascript
describe("getDueWords", () => {
  it("should map category names correctly", async () => {
    const mockProgress = [{ userId: "user1", wordId: "1", nextReview: new Date() }];

    const mockVocab = [
      {
        id: "1",
        simplified: "你好",
        categories: [{ category: { name: "Greetings" } }],
      },
    ];

    mockRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);
    mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

    const result = await service.getDueWords("user1", new Date());

    expect(result[0].categories).toEqual(["Greetings"]); // Flattened for API
  });
});
```

### Graceful Degradation Pattern

Services should handle missing repositories gracefully for better resilience:

```javascript
async getDueWords(userId, date) {
  const progressRecords = await this.repository.findDueByUserAndDate(userId, date);

  // Return raw progress if vocabulary repository unavailable
  if (!this.vocabularyRepository) {
    return progressRecords; // Partial functionality maintained
  }

  // Enrich with vocabulary data
  const enrichedWords = await this.enrichWithVocabulary(progressRecords);
  return enrichedWords;
}
```

**Benefits:**

- ✅ Allows progress tracking even if vocabulary service down
- ✅ Prevents cascading failures (one service failure doesn't break entire API)
- ✅ Enables gradual rollout (progress API works before vocabulary migration)

**Testing Pattern:**

```javascript
it("should return raw progress when vocabularyRepository missing", async () => {
  const serviceWithoutVocab = new ProgressService(mockRepository, null, null);
  const mockProgress = [{ id: "p1", wordId: "1", nextReview: "2025-01-15" }];

  mockRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);

  const result = await serviceWithoutVocab.getDueWords("user1", new Date());

  expect(result).toEqual(mockProgress); // Returns raw progress, doesn't throw
});
```

### Key Lessons

- **Always match mock structure to Prisma schema** - Use `include` in test data preparation queries
- **Map nested relations explicitly** - Don't assume flat arrays; navigate `.category.name` paths
- **Design for partial functionality** - Return degraded data instead of throwing errors
- **Test with real Prisma queries first** - Use integration tests to validate actual query shapes
- **Document service dependencies** - Make optional repositories explicit in constructor/docs

---

See also: [Cloud Database Providers](./backend-database-cloud.md), [SQLite for Local Dev](./backend-database-sqlite.md), [Supabase Setup Guide](../../guides/references/supabase-setup-guide.md)
