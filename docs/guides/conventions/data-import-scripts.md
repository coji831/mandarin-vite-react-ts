# Data Import Scripts for Prisma

**Last Updated:** July 21, 2026

**Purpose:** Standard pattern for creating one-time data seeding, migration, and external dataset import scripts using Prisma.

---

## When to Use

| Scenario                                                       | Tool                             |
| -------------------------------------------------------------- | -------------------------------- |
| One-time data seeding (run once, can be destructive)           | Import script                    |
| Application startup data (run every deploy)                    | `prisma/seed.js`                 |
| Schema migration with data transformation                      | Prisma migration + import script |
| Importing external datasets (Make Me a Hanzi, HSK lists, etc.) | Import script                    |

Import scripts live in `apps/backend/scripts/` (or `apps/backend/prisma/scripts/` for seed-related utilities). They are **not** part of the application build — they are executed directly by `node`.

---

## Script Pattern

### 1. ESM Module

Scripts use ESM (`.mjs` extension or `"type": "module"` in parent `package.json`) so `import`/`export` syntax works without transpilation.

```javascript
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

const { PrismaClient } = prismaPkg;
```

### 2. PrismaPg Adapter — Direct Connection String

Use `new PrismaPg({ connectionString: ... })` directly. **Do NOT** create a `pg.Pool` manually and pass it to `PrismaPg`.

```javascript
// ✅ CORRECT — direct connection string
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ❌ WRONG — custom pg.Pool bypasses Prisma's connection lifecycle
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool); // BAD: Prisma loses control of pooling
```

> **Why?** Creating a custom `pg.Pool` conflicts with Prisma's internal connection management. Prisma must own the pool to handle connection lifecycle, retries, and prepared statements correctly. See [Supabase Prisma quickstart](https://supabase.com/docs/guides/integrations/prisma) for the canonical pattern.

### 3. Load Environment Variables

Load `.env.local` from the monorepo root when running from `apps/backend/`:

```javascript
const DOTENV_PATH = resolve(process.cwd(), "../../.env.local");
dotenv.config({ path: DOTENV_PATH });
```

This works whether you run the script from `apps/backend/` or the project root (using npm workspace commands).

### 4. Path Resolution

Paths should be relative to the monorepo root (two levels up from `apps/backend/`):

```javascript
const DATA_FILE = resolve(process.cwd(), "../../data/make-me-a-hanzi/dictionary.txt");
```

---

## Idempotency

Scripts should be safe to run multiple times:

- **Batch inserts**: Use `createMany` with `skipDuplicates: true` for bulk loading where duplicate records should be silently ignored:

  ```javascript
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.characterRadical.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
  ```

- **Fine-grained control**: Use `upsert` when you need to update existing records or handle conflicts individually:

  ```javascript
  for (const record of records) {
    await prisma.contentItem.upsert({
      where: { id: record.id },
      update: { data: record.data },
      create: record,
    });
  }
  ```

  Prefer `createMany` with `skipDuplicates` for bulk imports (much faster); use `upsert` only when updates to existing records are needed.

---

## Error Handling

### Graceful Missing File Handling

When the script depends on an external data file that may not exist locally, check for it and print a helpful message:

```javascript
if (!existsSync(DATA_FILE)) {
  console.error(`❌ Data file not found: ${DATA_FILE}`);
  console.error("   Download from:");
  console.error("   https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt");
  process.exit(1);
}
```

### JSON Validation Before Processing

If the input is JSON (or line-delimited JSON), validate each record before processing to avoid partial imports:

```javascript
const lines = readFileSync(DATA_FILE, "utf-8").trim().split("\n");
for (const [index, line] of lines.entries()) {
  try {
    const record = JSON.parse(line);
    // validate required fields
    if (!record.character) {
      console.warn(`⚠️ Line ${index + 1}: missing "character" field, skipping`);
      continue;
    }
    processed.push(record);
  } catch {
    console.warn(`⚠️ Line ${index + 1}: invalid JSON, skipping`);
  }
}
```

---

## Progress Logging & Batch Processing

Log progress every 500 entries to provide visibility during long-running imports:

```javascript
const BATCH_SIZE = 500;
const LOG_INTERVAL = 500;

let inserted = 0;
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  await prisma.characterRadical.createMany({
    data: batch,
    skipDuplicates: true,
  });
  inserted += batch.length;

  if (inserted % LOG_INTERVAL === 0 || inserted === records.length) {
    console.log(`  ✓ ${inserted}/${records.length} records processed`);
  }
}
```

---

## Full Pattern Reference

See `apps/backend/scripts/import-decomposition-data.mjs` for a complete working example that demonstrates all of the above patterns:

- ESM with `@prisma/client` CJS compatibility (`import prismaPkg from "@prisma/client"`)
- Direct `PrismaPg({ connectionString })` adapter
- Dotenv loading from `../../.env.local`
- Graceful missing file handling with download URL
- Line-delimited JSON parsing with validation
- Batch processing with `createMany` + `skipDuplicates`
- Progress logging every 500 records

---

## What Not to Do

| ❌ Bad Practice                               | ✅ Good Practice                                   |
| --------------------------------------------- | -------------------------------------------------- |
| `new pg.Pool()` + `new PrismaPg(pool)`        | `new PrismaPg({ connectionString })`               |
| Hardcoded `DATABASE_URL`                      | Load from `.env.local` via `dotenv.config()`       |
| Single `try/catch` wrapping the entire import | Per-record validation + batch-level error handling |
| No progress logging                           | Log every 500 records                              |
| JSON.parse without try/catch                  | Validate each line before processing               |
| Mutating production data without safeguards   | Always idempotent (skipDuplicates or upsert)       |

---

## See Also

- `apps/backend/prisma/seed.js` — Application seed script (runs via `prisma db seed`)
- `apps/backend/scripts/import-decomposition-data.mjs` — Reference implementation
- `.github/instructions/prisma-schema-changes.instructions.md` — Prisma schema change safety
- `docs/knowledge-base/backend/backend-database-postgres.md` — Database setup and connection patterns
