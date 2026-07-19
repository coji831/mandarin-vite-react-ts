/**
 * ReviewPicker.tsx
 * Phase 1 Review — Content type and source selector.
 */
import React from "react";
import type { ReviewSource } from "../types";
import { useReviewSources } from "../hooks/useReviewSources";
import { Button, RadioGroup, Spinner } from "shared/components";
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
      <div className="flex-col gap-xs">
        <h2 className="review-picker__title text-primary font-xl m-0">🃏 Review</h2>
        <p className="review-picker__description text-muted font-sm m-0">
          No timer, no scoring. Self-rated: Again / Good / Easy.
        </p>
      </div>

      {/* Step 1: Content Type */}
      <div className="flex-col gap-md">
        <label className="review-picker__step-label text-secondary fw-600 font-md">
          Step 1: What do you want to review?
        </label>
        <div className="review-picker__cards grid gap-sm">
          {CONTENT_TYPES.map((ct) => {
            const isSelected = selectedType === ct.type;
            return (
              <Button
                key={ct.type}
                variant={isSelected ? "control-active" : "control"}
                className={`review-picker__card w-full flex-col ${isSelected ? "bg-primary-bg" : ""}`}
                onClick={() => setSelectedType(ct.type)}
                aria-pressed={isSelected}
              >
                <span className="review-picker__card-icon font-2xl">{ct.icon}</span>
                <span className="review-picker__card-label fw-700 font-md">{ct.label}</span>
                <span className="review-picker__card-desc text-muted font-sm">
                  {ct.description}
                </span>
                <span className="review-picker__card-count text-tertiary font-sm">All items</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Source */}
      <div className="flex-col gap-md review-picker__source-section">
        <label className="review-picker__step-label text-secondary fw-600 font-md">
          Step 2: Source (optional)
        </label>
        {checking ? (
          <div className="flex-center gap-sm text-tertiary font-sm p-sm">
            <Spinner size="xs" /> Checking available sources...
          </div>
        ) : (
          <RadioGroup
            name="source"
            options={SOURCES.map((s) => ({
              value: s.value,
              label: s.label,
              disabled: (() => {
                const count = sourceCounts[s.value as keyof typeof sourceCounts];
                return count !== -1 && count <= 0;
              })(),
            }))}
            value={selectedSource}
            onChange={(value) => setSelectedSource(value as ReviewSource)}
            layout="vertical"
          />
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        className={`review-picker__start-btn ${checking ? "op-60" : ""}`}
        onClick={() => onStart(selectedSource, selectedType)}
        disabled={checking}
      >
        {checking ? "Checking sources..." : "Start Review"}
      </Button>
    </div>
  );
}

export const ReviewPicker = React.memo(ReviewPickerComponent);
