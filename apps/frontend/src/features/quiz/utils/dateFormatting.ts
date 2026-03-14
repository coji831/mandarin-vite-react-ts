/**
 * Date Formatting Utilities
 * Story 15.10: Quiz UX Polish
 *
 * Provides relative time formatting for quiz results
 * (e.g., "in 3 days" instead of "Feb 19, 2026")
 */

/**
 * Format date as relative time string
 * @param date - Future date to format
 * @returns Relative time string or absolute date if > 7 days
 *
 * @example
 * formatRelativeTime(new Date(Date.now() + 3600000)) // "in 1 hour"
 * formatRelativeTime(new Date(Date.now() + 86400000)) // "tomorrow"
 * formatRelativeTime(new Date(Date.now() + 3 * 86400000)) // "in 3 days"
 * formatRelativeTime(new Date(Date.now() + 10 * 86400000)) // "Mar 1, 2026"
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Past dates
  if (diffMs < 0) {
    return "overdue";
  }

  // Within an hour
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "in 1 minute" : `in ${diffMinutes} minutes`;
  }

  // Within a day
  if (diffHours < 24) {
    return diffHours === 1 ? "in 1 hour" : `in ${diffHours} hours`;
  }

  // Tomorrow
  if (diffDays === 1) {
    return "tomorrow";
  }

  // Within a week
  if (diffDays <= 7) {
    return `in ${diffDays} days`;
  }

  // More than a week - show absolute date
  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a nullable ISO date string as relative time, with "N/A" fallback.
 * Used in ResultsTable to display next review dates.
 */
export function formatNextReviewDate(isoDate?: string | null): string {
  if (!isoDate) return "N/A";
  return formatRelativeTime(isoDate);
}
