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
export type {
  StreakData,
  Badge,
  XPData,
  MysteryBox,
  StreakResponse,
  BadgeResponse,
  FreezeResponse,
  BadgeItem,
} from "./types";
export { calculateLevel, getXPWithinLevel } from "./utils";
