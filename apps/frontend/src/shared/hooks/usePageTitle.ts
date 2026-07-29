/**
 * usePageTitle hook
 *
 * Sets `document.title` on mount and restores the previous title on unmount.
 * @param title - The title to set for the current page
 *
 * Usage:
 *   usePageTitle("Phonetic Clusters");
 */
import { useEffect } from "react";

export function usePageTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
