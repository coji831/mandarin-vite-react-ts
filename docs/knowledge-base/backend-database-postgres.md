# PostgreSQL Setup & Migrations

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

## When to Use

- Production, staging, or persistent dev environments

---

See also: [Cloud Database Providers](./backend-database-cloud.md), [SQLite for Local Dev](./backend-database-sqlite.md)
