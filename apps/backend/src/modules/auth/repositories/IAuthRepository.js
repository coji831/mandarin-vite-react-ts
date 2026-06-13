/**
 * IAuthRepository Interface
 * Defines the contract for authentication data access operations
 *
 * @interface IAuthRepository
 */

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object or null
 */
export async function findUserByEmail(email) {}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User object or null
 */
export async function findUserById(userId) {}

/**
 * Create new user
 * @param {object} data - User data {email, passwordHash, displayName}
 * @returns {Promise<object>} Created user
 */
export async function createUser(data) {}

/**
 * Create session with refresh token
 * @param {object} data - Session data {userId, refreshToken, expiresAt}
 * @returns {Promise<object>} Created session
 */
export async function createSession(data) {}

/**
 * Find session by refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<object|null>} Session with user or null
 */
export async function findSessionByToken(refreshToken) {}

/**
 * Delete session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {}

/**
 * Delete all sessions by refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<void>}
 */
export async function deleteSessionsByToken(refreshToken) {}
