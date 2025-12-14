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

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

```typescript
// apps/backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: await bcrypt.hash("Test1234!", 10),
      displayName: "Test User",
    },
  });

  // Seed vocabulary words from CSV
  const vocabularyWords = [
    { traditional: "你好", simplified: "你好", pinyin: "nǐ hǎo", english: "hello", level: "HSK1" },
    {
      traditional: "謝謝",
      simplified: "谢谢",
      pinyin: "xiè xiè",
      english: "thank you",
      level: "HSK1",
    },
    // ... more words
  ];

  await prisma.vocabularyWord.createMany({
    data: vocabularyWords,
    skipDuplicates: true,
  });

  console.log("Database seeded successfully");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

## Architecture Integration

```
Application Layer
    ↓ uses
Prisma Client (Generated)
    ↓ connects to
PostgreSQL Database
    ↓ manages
[User, Session, Progress, VocabularyWord] tables
```

All database access goes through Prisma Client for type safety. Connection pooling configured to handle 5-10 concurrent connections (suitable for Vercel serverless).

## Technical Challenges & Solutions

```
Problem: Connection pooling in serverless environment (Vercel functions)
Solution: Use Prisma Data Proxy or configure connection limits:
- Set connection_limit parameter in DATABASE_URL
- Use PgBouncer or similar for production
- Implement connection timeout and retry logic
```

```
Problem: Migration management across environments (dev, staging, prod)
Solution: Use Prisma Migrate with environment-specific DATABASE_URL:
- Development: npx prisma migrate dev (creates and applies migrations)
- Production: npx prisma migrate deploy (applies pending migrations only)
- Shadow database for safe migration validation
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
