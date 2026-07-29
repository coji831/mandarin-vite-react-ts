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
import "./PhoneticClustersPage.css";

export function PhoneticClustersPage() {
  usePageTitle("Phonetic Clusters");
  const { clusters, isLoading, error, hskFilter, setHskFilter, retry } = usePhoneticClusters();

  return (
    <div className="phonetic-clusters-page">
      <div className="phonetic-clusters-page__header mb-md">
        <h1 className="font-2xl text-primary fw-600 m-0">Phonetic Clusters</h1>
        <p className="font-sm text-tertiary m-0 mt-xs">
          Characters grouped by shared phonetic elements
        </p>
      </div>

      <PhoneticClustersContent
        clusters={clusters}
        isLoading={isLoading}
        error={error}
        hskFilter={hskFilter}
        onHskFilterChange={setHskFilter}
        onRetry={retry}
      />
    </div>
  );
}
