/**
 * ProfilePage — thin placeholder for the user profile route (/profile).
 *
 * Story 22.4: reachable from the UserMenu. Full profile implementation is a
 * future follow-up; this reserves the route with a clean placeholder surface.
 */
import { Box } from "shared/components";

export function ProfilePage() {
  return (
    <div className="flex-1 p-xl">
      <Box variant="card" className="w-full flex-col gap-md" padding="lg">
        <h1 className="text-primary font-2xl fw-600 m-0">Profile</h1>
        <p className="text-tertiary font-md m-0">
          Your profile page is coming soon. You can log out anytime from the account menu.
        </p>
      </Box>
    </div>
  );
}
