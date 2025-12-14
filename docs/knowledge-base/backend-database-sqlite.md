# SQLite for Local Development

**When Adopted:** Epic 13

## Why

Fast onboarding, no server required, ideal for prototyping and tests.

## Use Case

- New team members
- CI/test environments
- Early feature prototyping

## Steps

1. Set provider to `sqlite` in `prisma/schema.prisma`
2. Set `DATABASE_URL="file:./dev.db"` in `.env`
3. Run `npx prisma migrate dev --name init`
4. Use Prisma Client as usual

## Minimal Example

```prisma
// schema.prisma
model ExampleItem {
  id    Int     @id @default(autoincrement())
  name  String
  value Int?
  createdAt DateTime @default(now())
}
```

## Generic Usage Example

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.exampleItem.create({ data: { name: "Sample", value: 42 } });
  console.log("Created:", item);
}
main().finally(() => prisma.$disconnect());
```

## Key Lessons

- SQLite is not for production
- Easy to switch to Postgres later

---

See also: [PostgreSQL Setup](./backend-database-postgres.md), [Cloud Database Providers](./backend-database-cloud.md)
