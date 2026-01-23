/**
 * vocabularyConfig
 * Configuration for vocabulary data fetching from Google Cloud Storage.
 */
export const vocabularyConfig = {
  // Name of the lists JSON file in the GCS bucket
  listsFile: "vocabularyLists.json",

  // Cache TTL (seconds) used by VocabularyRepository in-memory cache
  cacheTTL: 3600,

  // GCS enabled flag (should always be true in production)
  gcsEnabled: process.env.GCS_ENABLED === "true",
};

export default vocabularyConfig;
