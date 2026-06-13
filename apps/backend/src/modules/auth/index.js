/**
 * @file apps/backend/src/modules/auth/index.js
 * @description Auth module - Public API
 *
 * Simple CRUD module for authentication operations.
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - AuthService: Authentication business logic (registration, login, token management)
 *
 * NOT exported: AuthRepository, AuthController, authRoutes, User entity, IAuthRepository
 */

export { AuthService } from "./services/AuthService.js";
