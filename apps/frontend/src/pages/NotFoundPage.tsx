/**
 * NotFoundPage — the app's single catch-all surface (`path="*"` in Router.tsx).
 *
 * Rework-proposal §10: an unknown path used to render AppLayout chrome around
 * an empty <Outlet> — a blank frame that reads as a loading failure. The route
 * sits INSIDE AppLayout so the chrome (rail + top bar) stays and the visitor is
 * never trapped; this page supplies the missing content.
 *
 * Contract (§10): the message is the page's <h1>; the single way back is the
 * first tab stop in the content region; there is exactly ONE catch-all — no
 * per-feature 404 fallbacks.
 *
 * Anatomy (page-anatomy law): PageShell(not-found measure) → PageStack →
 * PageHeader (h1 + description + the one CTA).
 */
import { useNavigate } from "react-router-dom";
import { Button, PageHeader, PageShell, PageStack } from "shared/components";
import { root } from "shared/constants";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageShell archetype="not-found">
      <PageStack size="default">
        <PageHeader
          title="Page not found"
          description="That address does not match a page in PinyinPal. It may have moved, or the link may be out of date."
        >
          <Button variant="primary" onClick={() => navigate(root)}>
            Back to dashboard
          </Button>
        </PageHeader>
      </PageStack>
    </PageShell>
  );
}
