# Implementation 13-2: Database Schema & ORM Configuration

## Technical Scope

Configure PostgreSQL database with Prisma ORM. Define schema for User, Session, Progress, and VocabularyWord models. Set up migrations, connection pooling, and seed data for development.

## Implementation Details

```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  displayName  String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  sessions  Session[]
  progress  Progress[]

  @@index([email])
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
}

model Progress {
  id          String   @id @default(uuid())
  userId      String
  wordId      String
  studyCount  Int      @default(0)
  correctCount Int     @default(0)
  confidence  Float    @default(0)
  nextReview  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@index([userId])
  @@index([nextReview])
}

model VocabularyWord {
  id            String @id @default(uuid())
  traditional   String
  simplified    String
  pinyin        String
  english       String
  level         String
  category      String?
  exampleSentence String?

  @@index([level])
}
```

```typescript
// apps/backend/src/infrastructure/database/client.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

```typescript
// apps/backend/prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create test users
  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash: await bcrypt.hash("Test1234!", 10),
      displayName: "Test User",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash: await bcrypt.hash("Demo1234!", 10),
      displayName: "Demo User",
    },
  });

  // Seed vocabulary words (PostgreSQL supports skipDuplicates)
  const vocabularyWords = [
    {
      traditional: "你好",
      simplified: "你好",
      pinyin: "nǐ hǎo",
      english: "hello",
      level: "HSK1",
      category: "Greetings",
    },
    {
      traditional: "謝謝",
      simplified: "谢谢",
      pinyin: "xiè xiè",
      english: "thank you",
      level: "HSK1",
      category: "Greetings",
    },
    {
      traditional: "再見",
      simplified: "再见",
      pinyin: "zài jiàn",
      english: "goodbye",
      level: "HSK1",
      category: "Greetings",
    },
    {
      traditional: "是",
      simplified: "是",
      pinyin: "shì",
      english: "to be",
      level: "HSK1",
      category: "Verbs",
    },
    {
      traditional: "不",
      simplified: "不",
      pinyin: "bù",
      english: "no / not",
      level: "HSK1",
      category: "Grammar",
    },
  ];

  await prisma.vocabularyWord.createMany({
    data: vocabularyWords,
    skipDuplicates: true,
  });

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
```

## Architecture Integration

```
Application Layer
    ↓ uses
Prisma Client (v7.1.0 with PostgreSQL Adapter)
    ↓ connects via
PostgreSQL Connection Pool (pg)
    ↓ connects to
Supabase PostgreSQL Database (Session Pooler)
    ↓ manages
[User, Session, Progress, VocabularyWord] tables
```

Connection pooling handled via pg Pool + Supabase Session Pooler (port 5432) for IPv4 compatibility and better migration support.

## Technical Challenges & Solutions

### Challenge 1: SQLite vs PostgreSQL Decision

**Problem:** Initially considered SQLite for simplicity, but encountered:

- Prisma 7 compatibility issues with SQLite
- `skipDuplicates` not supported in createMany
- Limited features for production multi-user app

**Solution:** Switched to PostgreSQL with Supabase

- Free tier (500MB storage)
- Better Prisma 7 support
- Production-ready from day 1
- Built-in connection pooling
- Easy migration path

**Impact:** Cleaner implementation, better features, same database in dev & prod

---

### Challenge 2: Prisma 7 Adapter Pattern

**Problem:** Prisma 7 requires adapter for database connections

```
PrismaClientInitializationError: `PrismaClient` needs to be constructed
with a non-empty, valid `PrismaClientOptions`
```

**Solution:** Install and configure PostgreSQL adapter

```bash
npm install @prisma/adapter-pg pg
```

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**Files Updated:**

- `src/infrastructure/database/client.ts`
- `prisma/seed.ts`
- All scripts that instantiate PrismaClient

---

### Challenge 3: Prisma 7 Schema Configuration

**Problem:** Prisma 7 changed datasource configuration

```
Error: The datasource property `url` is no longer supported in schema files
```

**Solution:** Move URL configuration to `prisma.config.ts`

```prisma
// schema.prisma - Remove url
datasource db {
  provider = "postgresql"
  // url = env("DATABASE_URL")  ← Remove this
}
```

```typescript
// prisma.config.ts - Add URL here
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"), // ← URL goes here now
  },
});
```

---

### Challenge 4: IPv4 vs IPv6 Network Compatibility

**Problem:** Direct connection (port 5432) failed with `ECONNREFUSED`

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Supabase warning: "Not IPv4 compatible - Use Session Pooler if on IPv4 network"

**Solution:** Use Supabase Session Pooler instead of Direct Connection

**Connection String Evolution:**

```bash
# ❌ Direct Connection (IPv6 only, failed)
postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres

# ❌ Transaction Pooler (hung on migrations)
postgresql://postgres.xxx:pass@aws-1-region.pooler.supabase.com:6543/postgres

# ✅ Session Pooler (IPv4 compatible, works with migrations)
postgresql://postgres.xxx:pass@aws-1-region.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Supabase Dashboard Settings:**

- Type: URI
- Source: primary database
- Method: **Session** (not Transaction, not Direct)

**Why Session Pooler:**

- IPv4 compatible (works on all networks)
- Supports schema operations (migrations, db push)
- Maintains persistent connections
- Works with Vercel, GitHub Actions, etc.

---

### Challenge 5: Password Special Characters in Connection String

**Problem:** Password contained `#` character which breaks URL parsing

```
postgresql://postgres:umIT6uR#wFy3a*a2@...
                              ↑ parsed as URL fragment
```

**Solution:** URL-encode special characters

```bash
# Original password: umIT6uR#wFy3a*a2
# Encoded password:  umIT6uR%23wFy3a*a2
#                           ↑↑↑ # → %23

DATABASE_URL="postgresql://postgres:umIT6uR%23wFy3a*a2@aws-1-region.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

**Special Characters to Encode:**

- `#` → `%23`
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`

---

### Challenge 6: Environment Variable Loading in Scripts

**Problem:** Test scripts couldn't connect - DATABASE_URL was undefined

```
Testing connection to: undefined
```

**Solution:** Import dotenv at top of all standalone scripts

```typescript
import "dotenv/config"; // ← Add this first
import { PrismaClient } from "@prisma/client";
```

**Files Requiring dotenv:**

- `test-connection.ts`
- `test-simple-connection.ts`
- `view-data.ts`
- `prisma/seed.ts` (via prisma.config.ts)

---

### Challenge 7: Migration Strategy with Pooler

**Problem:** `prisma migrate dev` requires shadow database, but pooler has limitations

**Solution:** Use `prisma db push` for development instead

```bash
# ✅ Works with Session Pooler
npx prisma db push

# ❌ May have issues with pooler
npx prisma migrate dev
```

**For Production:**

- Create migrations locally with direct connection
- Deploy with `npx prisma migrate deploy` (no shadow database needed)
- Or use `prisma db push` in development, migrations in production

---

## Final Configuration

**Package Versions:**

- `prisma@7.1.0`
- `@prisma/client@7.1.0`
- `@prisma/adapter-pg@7.1.0`
- `pg@8.x`
- `bcrypt@6.0.0`

**Connection String (Production-Ready):**

```bash
DATABASE_URL="postgresql://postgres.project:password@aws-1-region.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

**Key Features:**
✅ IPv4/IPv6 compatible
✅ Connection pooling enabled
✅ Works with migrations
✅ Vercel-ready
✅ Prisma 7 adapter pattern
✅ Type-safe queries
✅ Proper password encoding

---

## Commands Reference

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Seed database with test data
npm run db:seed

# View data in terminal
npx tsx view-data.ts

# Test connection
npx tsx test-simple-connection.ts

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (DESTRUCTIVE)
npx prisma db push --force-reset
```

## Testing Implementation

**Unit Tests:**

- Prisma Client instantiation and connection
- Model CRUD operations (create, read, update, delete)
- Unique constraints enforced (email, userId+wordId)
- Cascade deletes work correctly

**Integration Tests:**

- Full migration cycle (up and down)
- Seed script populates database without errors
- Connection pooling under concurrent load
- Prisma Studio accessible for manual inspection
