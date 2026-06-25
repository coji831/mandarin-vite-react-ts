---
name: prisma-migration
description: "Run Prisma schema changes safely after editing schema.prisma. Use when: editing schema.prisma, adding new models, changing columns, database migration."
user-invocable: true
---

# Prisma Migration Skill

## When to Use

- After editing `apps/backend/prisma/schema.prisma`
- When adding new database models
- When changing existing columns or relations
- When you encounter "Model not found" or "Column doesn't exist" errors

## Procedure

1. Open `apps/backend/prisma/schema.prisma` and make your changes
2. Run Prisma client regeneration:
   ```
   cd apps/backend && npx prisma generate
   ```
3. Create a migration:
   ```
   cd apps/backend && npx prisma migrate dev --name <short-description-of-change>
   ```
4. Verify the migration file was created in `apps/backend/prisma/migrations/`
5. Run tests to confirm no 500 errors

## Common Issues

- **Already ran `prisma db push` instead?** Create a proper migration afterward: `prisma migrate dev --name catch-up`
- **Migration conflict?** Run `prisma migrate dev` — it will prompt you to reset if needed
- **Generated client still old?** Make sure you ran `prisma generate` from the `apps/backend` directory

## Reference

See `.github/instructions/prisma-schema-changes.instructions.md` for more details.
