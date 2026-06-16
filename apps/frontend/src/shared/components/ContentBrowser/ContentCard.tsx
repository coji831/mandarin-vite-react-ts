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

import type { ContentItem } from "./types";

export { ContentCard };

const TYPE_ICONS: Record<string, string> = {
  foundations: "🔤",
  radical: "📘",
  phonetic: "🔊",
  reader: "📖",
  grammar: "📕",
  chengyu: "🏮",
};

function ContentCard({
  item,
  onClick,
}: {
  item: ContentItem;
  onClick?: (item: ContentItem) => void;
}) {
  const { contentType, title, subtitle, translation, hskLevel, isLocked } = item;
  const typeIcon = TYPE_ICONS[contentType] ?? "📋";
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

  // TODO: Add type-specific card layouts per wireframe Section 8.1
  //   - vocabulary: show HSK level, pinyin, translation (current default)
  //   - radical: show stroke count, Top20 marker
  //   - phonetic: show cluster group, character list
  //   - reader: show progress badge, Read button
  //   - grammar: show pattern description
  //   - chengyu: show story teaser

  return (
    <div
      className={`content-card ${isLocked ? "content-card--locked" : "content-card--unlocked"}`}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${title}${subtitle ? ` - ${subtitle}` : ""}${isLocked ? " (locked)" : ""}`}
      aria-disabled={isLocked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Type badge */}
      <span className="content-card__type-badge" aria-hidden="true">
        {typeIcon}
      </span>

      {/* Lock badge */}
      {isLocked && (
        <span className="content-card__lock-badge" aria-label="Locked content">
          🔒
        </span>
      )}

      {/* Card body */}
      <div className="content-card__body">
        <h3 className="content-card__title">{title}</h3>
        {subtitle && <p className="content-card__subtitle">{subtitle}</p>}
        {translation && <p className="content-card__translation">{translation}</p>}
        {hskLevel && <span className="content-card__hsk">HSK {hskLevel}</span>}
      </div>
    </div>
  );
}
