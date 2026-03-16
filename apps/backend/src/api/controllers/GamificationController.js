/**
 * @file GamificationController.js
 * @description HTTP controller for gamification endpoints (streaks, badges, freezes)
 * Story 15.3: Streak & Gamification Backend APIs
 */

/**
 * GamificationController
 * Handles HTTP requests for streak tracking and badge systems
 * Keep business logic in services - controller only maps HTTP to service calls
 */
export class GamificationController {
  constructor(streakService, gamificationService) {
    this.streakService = streakService;
    this.gamificationService = gamificationService;

    // Bind methods for use as Express route handlers
    this.getStreak = this.getStreak.bind(this);
    this.spendFreeze = this.spendFreeze.bind(this);
    this.getBadges = this.getBadges.bind(this);
  }

  /**
   * GET /api/v1/progress/streak
   * Fetch user's streak data
   *
   * @param {object} req - Express request (expects req.userId from auth middleware)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async getStreak(req, res) {
    try {
      const userId = req.userId;
      const streak = await this.streakService.getStreak(userId);

      return res.status(200).json({
        currentStreak: streak.currentStreak || 0,
        longestStreak: streak.longestStreak || 0,
        freezeCount: streak.freezeCount || 0,
        lastActivityDate: streak.lastActivityDate,
      });
    } catch (error) {
      console.error("[GamificationController] Error fetching streak:", error);
      return res.status(500).json({ error: "Failed to fetch streak data" });
    }
  }

  /**
   * POST /api/v1/progress/streak/freeze
   * Spend freeze to protect streak
   *
   * Business rules:
   * - Requires freezeCount >= 1
   * - Only works when streak at risk (>48h since last activity)
   * - Extends lastActivityDate by 24 hours
   *
   * @param {object} req - Express request (expects req.userId from auth middleware)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async spendFreeze(req, res) {
    try {
      const userId = req.userId;
      const result = await this.streakService.spendFreeze(userId);

      return res.status(200).json({
        message: "Freeze spent successfully",
        currentStreak: result.currentStreak,
        freezeCount: result.freezeCount,
        lastActivityDate: result.lastActivityDate,
      });
    } catch (error) {
      // Business rule validation errors (40x)
      if (
        error.message.includes("No freezes available") ||
        error.message.includes("Streak not at risk") ||
        error.message.includes("No streak record")
      ) {
        return res.status(400).json({ error: error.message });
      }

      // Unexpected errors (50x)
      console.error("[GamificationController] Error spending freeze:", error);
      return res.status(500).json({ error: "Failed to spend freeze" });
    }
  }

  /**
   * GET /api/v1/gamification/badges
   * Fetch user's earned and available badges
   *
   * Response format:
   * {
   *   earned: [{ id, name, icon, tier, earnedDate }],
   *   available: [{ id, name, icon, tier, progress, required, percentComplete }]
   * }
   *
   * @param {object} req - Express request (expects req.userId from auth middleware)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async getBadges(req, res) {
    try {
      const userId = req.userId;
      const badges = await this.gamificationService.getBadges(userId);

      return res.status(200).json(badges);
    } catch (error) {
      console.error("[GamificationController] Error fetching badges:", error);
      return res.status(500).json({ error: "Failed to fetch badges" });
    }
  }
}

export default GamificationController;
