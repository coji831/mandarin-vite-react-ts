/**
 * @file apps/backend/src/nest/shared/database.module.ts
 * @description NestJS `DatabaseModule` — exposes the shared `PrismaClient` as a
 * singleton provider using the Prisma 7 CJS-only pattern (Story 24-4).
 *
 * Replicates `src/shared/infrastructure/database/client.ts` as a Nest
 * `useFactory` provider: Prisma 7 ships a CJS-only `@prisma/client`, so we
 * default-import the package and destructure `PrismaClient`, and pass the
 * `PrismaPg` adapter a *connection string* (not a `pg.Pool`) so Prisma manages
 * its own pool (Neon + Prisma recommendation).
 *
 * Graceful shutdown (R2 AC): implements `OnApplicationShutdown` so the shared
 * `PrismaClient` is disconnected on SIGTERM (Railway restart/rollback). Hooks
 * are enabled via `app.enableShutdownHooks()` in `configure-app.ts`.
 */

import { Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../../shared/config/index.js";

// Prisma 7: CJS-only default import — destructure the class from the package.
const { PrismaClient } = prismaPkg;

@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () =>
        new PrismaClient({
          // Adapter gets a connection string, not a custom pg.Pool — Prisma
          // manages its own pool (Neon + Prisma docs).
          adapter: new PrismaPg({ connectionString: config.databaseUrl }),
        }),
    },
  ],
  exports: [PrismaClient],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PrismaClient) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async onApplicationShutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Re-export the class as the injection token so sibling modules / consumers
// reference the SAME token without re-importing the CJS package.
export { PrismaClient };
