/**
 * @file User.js
 * @description User entity - Domain model for authenticated users
 *
 * Clean Architecture: Domain Layer - Core business entity
 * Represents a user within the authentication context.
 *
 * Responsibilities:
 * - Encapsulate user identity and profile data
 * - Provide display name fallback logic
 */

export class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.displayName = data.displayName || data.email?.split("@")[0];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
