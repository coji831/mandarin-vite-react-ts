/**
 * @file GuestUpsell.tsx
 * @description Presentational sign-in upsell card for guest-gated features.
 * Bug 2: shared primitive — callers gate on `useAuth().isAuthenticated` and
 * render this in place of registered-only / write actions (Generate, Edit,
 * Save to Review, etc.). No auth logic lives here.
 *
 * Visual weight matches ReviewPromptCard (Box variant="dark" + primary CTA).
 * CTA navigates to `register_page` by default; override via `to`.
 */
import { useNavigate } from "react-router-dom";
import { Box, Button } from "shared/components";
import { register_page } from "shared/constants";

export type GuestUpsellProps = {
  /** Card heading (e.g. "Mnemonic stories"). */
  title: string;
  /** Supporting copy explaining the registered-user benefit. */
  description: string;
  /** Leading emoji/icon glyph shown before the title (e.g. "🔒"). */
  icon?: string;
  /** CTA label. Defaults to "Create an account to unlock ▸". */
  ctaLabel?: string;
  /** Route to navigate to on CTA click. Defaults to the register page. */
  to?: string;
};

export function GuestUpsell({
  title,
  description,
  icon,
  ctaLabel = "Create an account to unlock ▸",
  to = register_page,
}: GuestUpsellProps) {
  const navigate = useNavigate();

  return (
    <Box variant="dark" padding="lg" className="flex-col gap-md">
      <h2 className="font-2xl fw-700 text-primary m-0">{icon ? `${icon} ${title}` : title}</h2>
      <p className="font-sm text-secondary m-0 lh-normal">{description}</p>

      <Button variant="primary" onClick={() => navigate(to)}>
        {ctaLabel}
      </Button>
    </Box>
  );
}
