/**
 * ReviewPromptCard
 *
 * Guest-facing upsell card that markets SRS review as a registered-user benefit.
 * Styled to match ReviewLaunchCard layout (same card class, same visual weight).
 */
import { useNavigate } from "react-router-dom";
import { Box, Button } from "shared/components";
import { register_page } from "shared/constants";

export function ReviewPromptCard() {
  const navigate = useNavigate();

  return (
    <Box variant="dark" padding="lg" className="flex-col gap-md">
      <h2 className="font-2xl fw-700 text-primary m-0">🔒 Spaced Repetition Review</h2>
      <p className="font-sm text-secondary m-0 lh-normal">
        Master characters long-term with smart flashcards that adapt to your learning pace.
      </p>

      <Button variant="primary" onClick={() => navigate(register_page)}>
        Create an account to unlock ▸
      </Button>
    </Box>
  );
}
