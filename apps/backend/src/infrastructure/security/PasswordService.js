/**
 * PasswordService
 * Infrastructure layer service for password hashing and validation
 */

import bcrypt from "bcrypt";

export class PasswordService {
  constructor() {
    this.SALT_ROUNDS = 10;
  }

  /**
   * Validate password strength
   * @param {string} password - Plain text password
   * @returns {boolean} True if valid
   * @throws {Error} If password doesn't meet requirements
   */
  validatePassword(password) {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      throw new Error(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    }
    return true;
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare plain text password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if match
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}
