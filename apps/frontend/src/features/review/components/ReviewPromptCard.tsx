/**
 * ReviewPromptCard
 *
 * Guest-facing upsell card that markets SRS review as a registered-user benefit.
 * Styled to match ReviewLaunchCard layout (same card class, same visual weight).
 * Bug 2: refactored onto the shared GuestUpsell primitive — review-specific copy
 * preserved exactly, CTA still routes to the register page.
 */
import { GuestUpsell } from "shared/components";

export function ReviewPromptCard() {
  return (
    <GuestUpsell
      icon="🔒"
      title="Spaced Repetition Review"
      description="Master characters long-term with smart flashcards that adapt to your learning pace."
    />
  );
}
