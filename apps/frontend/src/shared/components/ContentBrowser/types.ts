/**
 * ContentBrowser Types
 *
 * Shared type definitions for the ContentBrowser component system.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Defines:
 * - ContentType: Union of supported content types
 * - ContentItem: Unified data shape for all browsable content
 * - ContentSource: Data loading interface for pluggable backends
 * - TabDefinition: Tab configuration for the TabBar
 * - CONTENT_TABS: Default tab configurations
 */

import type { IconName } from "shared/components";

export type ContentType = "foundations" | "radical" | "phonetic" | "reader" | "grammar" | "chengyu";

export interface ContentItem {
  id: string;
  contentType: ContentType;
  title: string; // Main display text (Chinese)
  subtitle?: string; // Secondary text (pinyin)
  translation?: string; // English translation
  hskLevel?: number; // 1-6
  phase: number; // 1-4 (content unlock phase)
  isLocked?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ContentSource {
  getItems: (params: {
    contentType?: ContentType;
    searchQuery?: string;
    hskLevel?: number;
    phase?: number;
    page: number;
    pageSize: number;
  }) => Promise<{ items: ContentItem[]; total: number }>;
}

export type TabDefinition = {
  id: ContentType | "all";
  label: string;
  /** Sanctioned icon name (ADR-010 / Q8) — rendered via the shared Icon component. */
  icon: IconName;
  isLocked?: boolean;
};

export const CONTENT_TABS: TabDefinition[] = [
  { id: "all", label: "All", icon: "book" },
  { id: "foundations", label: "Foundations", icon: "letters" },
  { id: "radical", label: "Radicals", icon: "radicals" },
  { id: "phonetic", label: "Phonetic", icon: "audio" },
  { id: "reader", label: "Readers", icon: "book" },
  { id: "grammar", label: "Grammar", icon: "grammar" },
  { id: "chengyu", label: "Chengyu", icon: "chengyu" },
];
