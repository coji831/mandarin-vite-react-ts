/**
 * ContentBrowserPage
 *
 * Page component that provides a ContentSource to the ContentBrowser.
 * Story 17.7: Content Browser Infrastructure.
 *
 * This page wraps the shared ContentBrowser component with a data source.
 * Initially uses an empty data source since this is infrastructure setup;
 * real data sources will be plugged in by subsequent stories.
 *
 * Route: /learn (index route for Learn section)
 */

import { ContentBrowser } from "../shared/components/ContentBrowser";
import type { ContentSource } from "../shared/components/ContentBrowser";

// Temporary empty content source — will be replaced by real implementations
const emptyContentSource: ContentSource = {
  getItems: async () => ({ items: [], total: 0 }),
};

export default function ContentBrowserPage() {
  // TODO: Read actual user phase from progress store
  const userPhase = 1;

  return (
    <ContentBrowser contentSource={emptyContentSource} defaultTab="all" userPhase={userPhase} />
  );
}
