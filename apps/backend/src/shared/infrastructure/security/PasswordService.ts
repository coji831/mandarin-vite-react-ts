/**
 * PasswordService
 * Infrastructure layer service for password hashing and validation
 */

import bcrypt from "bcrypt";

export class PasswordService {
  public readonly SALT_ROUNDS: number;

  constructor() {
    this.SALT_ROUNDS = 10;
  }

  /**
   * Validate password strength
   * @param password - Plain text password
   * @returns True if valid
   * @throws If password doesn't meet requirements
   */
  validatePassword(password: string): boolean {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      throw new Error(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    }
    return true;
  }

  /**
   * Hash password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare plain text password with hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if match
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
