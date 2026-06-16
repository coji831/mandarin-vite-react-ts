/**
 * LibraryPage
 *
 * Library section — freeroam search + content browser with no phase gating.
 * Wireframe Section 1.1: Library at /library
 * Available after Phase 1.
 *
 * D1: Uses ContentBrowser with no phase gating (all content visible).
 */

import { ContentBrowser } from "../shared/components/ContentBrowser";
import type { ContentSource } from "../shared/components/ContentBrowser";

// Library-specific content source with no phase gating
const libraryContentSource: ContentSource = {
  getItems: async () => ({ items: [], total: 0 }),
};

export default function LibraryPage() {
  // Library shows ALL content regardless of phase
  return <ContentBrowser contentSource={libraryContentSource} defaultTab="all" userPhase={4} />;
}
