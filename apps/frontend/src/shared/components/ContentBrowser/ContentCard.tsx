/**
 * ContentCard Component
 *
 * Polymorphic card component that renders different card layouts based on contentType.
 * Story 17.7: Content Browser Infrastructure.
 *
 * Features:
 * - Type badge with icon per content type
 * - Lock badge overlay for locked content
 * - Title (Chinese), subtitle (pinyin), translation, HSK level display
 * - Keyboard-accessible with role="button" and aria-label
 * - Not clickable when locked
 *
 * Usage:
 * ```tsx
 * <ContentCard item={item} onClick={(item) => handleClick(item)} />
 * ```
 */

import { Button, Icon } from "shared/components";
import type { IconName } from "shared/components";
import type { ContentItem, ContentType } from "./types";

export { ContentCard };

const TYPE_ICONS: Record<ContentType, IconName> = {
  foundations: "letters",
  radical: "radicals",
  phonetic: "audio",
  reader: "book",
  grammar: "grammar",
  chengyu: "chengyu",
};

function ContentCard({
  item,
  onClick,
  isActive = false,
}: {
  item: ContentItem;
  onClick?: (item: ContentItem) => void;
  /**
   * The item currently open in the hub. The "current" state is carried by a
   * check glyph AND a weight change, not by colour alone (rework-proposal §5):
   * a border that differs only in hue is still a colour-only cue (SC 1.4.1).
   */
  isActive?: boolean;
}) {
  const { contentType, title, subtitle, translation, hskLevel, isLocked } = item;
  const typeIcon = TYPE_ICONS[contentType];
  const handleClick = () => {
    if (!isLocked && onClick) {
      onClick(item);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // Future: Add type-specific card layouts per wireframe Section 8.1
  //   - vocabulary: show HSK level, pinyin, translation (current default)
  //   - radical: show stroke count, Top20 marker
  //   - phonetic: show cluster group, character list
  //   - reader: show progress badge, Read button
  //   - grammar: show pattern description
  //   - chengyu: show story teaser

  return (
    <Button
      variant="control"
      className={`content-card flex-col ${isLocked ? "content-card--locked op-60" : "content-card--unlocked"}`}
      aria-label={`${title}${subtitle ? ` - ${subtitle}` : ""}${isLocked ? " (locked)" : ""}${isActive ? " (open)" : ""}`}
      aria-current={isActive ? "true" : undefined}
      disabled={isLocked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Lock badge */}
      {isLocked && (
        <span className="content-card__lock-badge absolute flex-center">
          <Icon name="lock" size={16} label="Locked content" />
        </span>
      )}

      {/* Card body */}
      <div className="content-card__body flex-col gap-xs">
        <div className="content-card__title-row flex-center gap-xs">
          <span className="content-card__type-badge lh-1" aria-hidden="true">
            <Icon name={typeIcon} size={16} />
          </span>
          <span className="content-card__title font-lg">{title}</span>
          {/* Second, non-colour cue for the open item: a check glyph. */}
          {isActive && (
            <span className="text-success fw-700" aria-hidden="true">
              ✓
            </span>
          )}
        </div>
        {(subtitle || translation) && (
          <p className="content-card__subtitle-row">
            {subtitle}
            {subtitle && translation && <span className="content-card__separator"> · </span>}
            {translation}
          </p>
        )}
        <div className="content-card__meta-row flex-center gap-xs">
          {hskLevel && (
            <span className="content-card__hsk inline-block p-xs bg-primary-bg text-primary-light radius-sm font-xs fw-500 self-start">
              HSK {hskLevel}
            </span>
          )}
        </div>
      </div>
    </Button>
  );
}
