/**
 * @file apps/backend/src/modules/auth/nest/auth.module.ts
 * @description NestJS `@Module` for the Auth module (Story 24-6 — Auth
 * Module Port).
 *
 * Wires `AuthService` (constructor-injected with `AuthRepository` +
 * `JwtService` + `PasswordService`) and exports it. `SharedModule` is imported
 * for `JwtService`/`PasswordService`; `GuardsModule` so the `AuthGuard` applied
 * to `GET /me` and its `JwtService` dependency resolve in this module's
 * context. `useFactory` + `@Inject()` (not auto constructor-param injection)
 * because tsx/esbuild emits no decorator metadata in the dev loop; the
 * compiled tsc build gets metadata for free.
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
