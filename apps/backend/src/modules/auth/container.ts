/**
 * @file modules/auth/container.ts
 * @description Module-level DI container factory for the Auth module.
 */
import { AuthRepository } from "./repositories/AuthRepository.js";
import { AuthService } from "./services/AuthService.js";
import { AuthController } from "./api/AuthController.js";
import { JwtService } from "../../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../../shared/infrastructure/security/PasswordService.js";

export interface AuthModuleDeps {
  authRepository: AuthRepository;
  jwtService: JwtService;
  passwordService: PasswordService;
}

export function createAuthModule(deps: AuthModuleDeps) {
  const service = new AuthService(deps.authRepository, deps.jwtService, deps.passwordService);
  const controller = new AuthController(service);
  return { controller };
}
