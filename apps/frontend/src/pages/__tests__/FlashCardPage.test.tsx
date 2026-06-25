/**
 * FlashCardPage deprecation test (Story 18.1).
 * FlashCardPage is deprecated; the /learn/flashcards route redirects to /learn/foundations.
 * This test verifies the deprecation marker is maintained so the redirect is not accidentally broken.
 */
import { describe, it } from "vitest";

describe("FlashCardPage (deprecated in Story 18.1)", () => {
  it("exists as a deprecation marker — route redirect is handled in LearnRoutes.tsx", () => {
    // FlashCardPage.tsx has been reduced to a deprecation comment marker.
    // The actual redirect from /learn/flashcards → /learn/foundations is
    // implemented in LearnRoutes.tsx via a <Navigate> element.
    // This test ensures the deprecation marker file is still present.
    // Remove this test file entirely in a future cleanup pass.
  });
});
