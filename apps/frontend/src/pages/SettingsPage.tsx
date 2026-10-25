/**
 * SettingsPage — thin placeholder for the settings route (/settings).
 *
 * Story 22.4: reachable from the UserMenu. Full settings implementation is a
 * future follow-up; this reserves the route with a clean placeholder surface.
 *
 * Anatomy (page-anatomy law): PageShell(settings measure) → PageStack → card.
 */
import { Box, PageShell, PageStack } from "shared/components";

export function SettingsPage() {
  return (
    <PageShell archetype="settings">
      <PageStack size="default">
        <Box variant="card" className="w-full flex-col gap-md" padding="lg">
          <h1 className="text-primary font-2xl fw-600 m-0">Settings</h1>
          <p className="text-tertiary font-md m-0">
            Your settings page is coming soon. Preferences will live here.
          </p>
        </Box>
      </PageStack>
    </PageShell>
  );
}
