/**
 * ReviewPicker.tsx
 * Phase 1 Review — Content type and source selector.
 */
import React from "react";
import type { ReviewSource } from "../types";
import { useReviewSources } from "../hooks/useReviewSources";
import "./ReviewPicker.css";

type ContentTypeOption = {
  type: string;
  label: string;
  icon: string;
  description: string;
};

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    type: "pinyin",
    label: "Pinyin",
    icon: "🔤",
    description: "Initials, finals, and combinations",
  },
  {
    type: "tones",
    label: "Tones",
    icon: "🎵",
    description: "Tone identification, pairs, and rules",
  },
  {
    type: "radicals",
    label: "Radicals",
    icon: "📘",
    description: "Kangxi radicals",
  },
  {
    type: "char-radical",
    label: "Char→Radical",
    icon: "🔍",
    description: "Character radical decomposition",
  },
];

const SOURCES: { value: ReviewSource; label: string; description: string }[] = [
  { value: "due", label: "📅 Due for review", description: "Items scheduled for review today" },
  {
    value: "recent",
    label: "🕐 Recently studied",
    description: "Items reviewed in the last 7 days",
  },
  { value: "all", label: "📚 All Foundations", description: "All Phase 1 content" },
];

type ReviewPickerProps = {
  onStart: (source: ReviewSource, type: string) => void;
  presetType?: string | null;
};

function ReviewPickerComponent({ onStart, presetType }: ReviewPickerProps) {
  const {
    sourceCounts,
    checking,
    selectedType,
    setSelectedType,
    selectedSource,
    setSelectedSource,
  } = useReviewSources(presetType ?? undefined);

  return (
    <div className="review-picker flex-col gap-xl mx-auto">
      <h2 className="review-picker__title text-primary font-xl m-0">🃏 Review</h2>
      <p className="review-picker__description text-muted font-sm m-0 mt-xs">
        No timer, no scoring. Self-rated: Again / Good / Easy.
      </p>

      {/* Step 1: Content Type */}
      <div className="flex-col gap-md">
        <label className="review-picker__step-label text-secondary fw-600 font-md">
          Step 1: What do you want to review?
        </label>
        <div className="review-picker__cards">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.type}
              className={`review-picker__card flex-col-center gap-xs cursor-pointer ${selectedType === ct.type ? "review-picker__card--selected" : "review-picker__card--default"}`}
              onClick={() => setSelectedType(ct.type)}
              aria-pressed={selectedType === ct.type}
              type="button"
            >
              <span className="review-picker__card-icon font-2xl">{ct.icon}</span>
              <span className="review-picker__card-label fw-700 font-md">{ct.label}</span>
              <span className="review-picker__card-desc text-muted font-sm">{ct.description}</span>
              <span className="review-picker__card-count text-tertiary font-sm">All items</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Source */}
      <div className="flex-col gap-md review-picker__source-section">
        <label className="review-picker__step-label text-secondary fw-600 font-md">
          Step 2: Source (optional)
        </label>
        {checking ? (
          <div className="flex-center gap-sm text-tertiary font-sm p-sm">
            <span className="spinner" /> Checking available sources...
          </div>
        ) : (
          <div className="flex-col gap-sm" role="radiogroup" aria-label="Review source">
            {SOURCES.map((s) => {
              const count = sourceCounts[s.value as keyof typeof sourceCounts];
              const hasItems = count === -1 || count > 0; // "all" always available
              return (
                <label
                  key={s.value}
                  className={`review-picker__radio flex gap-sm py-sm px-md radius-md ${hasItems ? "cursor-pointer" : "op-60"} ${selectedSource === s.value ? "review-picker__radio--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={s.value}
                    checked={selectedSource === s.value}
                    onChange={() => setSelectedSource(s.value)}
                    disabled={!hasItems}
                  />
                  <span style={{ fontWeight: selectedSource === s.value ? 600 : 400 }}>
                    {s.label}
                  </span>
                  <span className="review-picker__radio-desc text-tertiary font-sm">
                    {!hasItems ? "No items available — try another source" : s.description}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <button
        className={`review-picker__start-btn btn-primary btn-lg ${checking ? "op-60" : ""}`}
        onClick={() => onStart(selectedSource, selectedType)}
        disabled={checking}
        type="button"
      >
        {checking ? "Checking sources..." : "Start Review"}
      </button>
    </div>
  );
}

export const ReviewPicker = React.memo(ReviewPickerComponent);
