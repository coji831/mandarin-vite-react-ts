/**
 * Gamification feature barrel export
 */
export {
  BadgeCelebrationModal,
  BadgeDisplay,
  MysteryBoxModal,
  StreakCounter,
  XPProgressBar,
} from "./components";
export { useFetchStreak, useFetchBadges, useSpendFreeze } from "./hooks";
export { fetchStreak, fetchBadges, spendFreeze } from "./services";
export type { StreakData, Badge, XPData, MysteryBox } from "./types/GamificationTypes";
export type { StreakResponse, BadgeResponse, FreezeResponse, BadgeItem } from "./services";
export { calculateLevel, getXPWithinLevel } from "./utils";
