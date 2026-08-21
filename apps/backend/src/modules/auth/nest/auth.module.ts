/**
 * @file apps/backend/src/modules/auth/nest/auth.module.ts
 * @description NestJS `@Module` for the Auth module (Story 24-6 — Auth
 * Module Port).
 *
 * 1:1 translation of `createAuthModule(deps)` in `modules/auth/container.ts`,
 * wiring the same framework-agnostic services through Nest providers:
 *
 *   - `AuthRepository`  — self-imports the shared Prisma singleton (same as
 *     the Express path); provided via `useFactory`.
 *   - `AuthService`     — constructor-injected with `AuthRepository` +
 *     `JwtService` + `PasswordService` (the same three deps the factory takes,
 *     the latter two resolved from `SharedModule`, 24-4).
 *
 * Explicit `useFactory` providers + `@Inject()` decorators (NOT auto
 * constructor-param injection) because `tsx` (esbuild) does not emit decorator
 * metadata in the dev loop; the compiled tsc build gets metadata for free.
 *
 * The controller applies `AuthGuard` (24-5) to `GET /me`; `GuardsModule` is
 * imported so the guard + its `JwtService` dependency resolve in this module's
 * context. `SharedModule` is imported directly for `JwtService`/`PasswordService`.
 *
 * The Express wiring (`container.ts`, `api/AuthController.ts`,
 * `api/authRoutes.ts`) is UNTOUCHED — this module coexists as the Nest shell
 * surface and is deleted at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { AuthNestController } from "./auth-nest.controller.js";
import { AuthRepository } from "../repositories/AuthRepository.js";
import { AuthService } from "../services/AuthService.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
import { JwtService } from "../../../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../../../shared/infrastructure/security/PasswordService.js";

@Module({
  imports: [SharedModule, GuardsModule],
  controllers: [AuthNestController],
  providers: [
    { provide: AuthRepository, useFactory: () => new AuthRepository() },
    {
      provide: AuthService,
      useFactory: (
        authRepository: AuthRepository,
        jwtService: JwtService,
        passwordService: PasswordService,
      ) => new AuthService(authRepository, jwtService, passwordService),
      inject: [AuthRepository, JwtService, PasswordService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
