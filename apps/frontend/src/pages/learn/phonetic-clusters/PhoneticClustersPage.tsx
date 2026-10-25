/**
 * @file pages/learn/phonetic-clusters/PhoneticClustersPage.tsx
 * @description Page container for the Phonetic Clusters browser
 * Story 21.6: Phonetic Clusters
 *
 * Renders the phonetic cluster content component inside LearnLayout context.
 * Delegates all data fetching and state management to usePhoneticClusters hook.
 */

import { PhoneticClustersContent, usePhoneticClusters } from "features/phonetic-clusters";
import { usePageTitle } from "shared/hooks";
import { PageHeader, PageShell, PageStack } from "shared/components";

export function PhoneticClustersPage() {
  usePageTitle("Phonetic Clusters");
  const { clusters, isLoading, error, hskFilter, setHskFilter, retry } = usePhoneticClusters();

  return (
    <PageShell archetype="list">
      <PageStack size="default">
        <PageHeader
          title="Phonetic Clusters"
          description="Characters grouped by shared phonetic elements"
        />

        <PhoneticClustersContent
          clusters={clusters}
          isLoading={isLoading}
          error={error}
          hskFilter={hskFilter}
          onHskFilterChange={setHskFilter}
          onRetry={retry}
        />
      </PageStack>
    </PageShell>
  );
}
