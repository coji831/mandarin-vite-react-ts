/**
 * LearnRoutes.tsx
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout (nav-less since Story 22.4 — Learn tabs live in the
 *   sidebar's phase-gated Learn group)
 * - Index route redirects to /learn/foundations
 * - Each content type has its own route (dedicated page or placeholder)
 * - Old routes (flashcards, basic) redirect to /learn/foundations
 *
 * Story 18.1: Replaced ContentBrowser index with phase-gated route navigation.
 * ContentBrowser still works at /library for freeroam browsing.
 * S2 (session = route, not modal): `hub/:entityType/:entityId` is the routed
 * Focus surface that hosts a lexical detail — a learning session is a route,
 * never an overlay (design-revalidation-guide.md §4).
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { lexical_entity_route, practices_quiz, practices_review } from "shared/constants";
import { LearnLayout } from "../shared/layouts/LearnLayout";
import { LexicalEntityPage } from "../pages/learn/hub/LexicalEntityPage";
import {
  FoundationsPage,
  RadicalsPage,
  GrammarPage,
  ChengyuPage,
} from "../pages/learn/foundations";
import { PhoneticClustersPage } from "../pages/learn/phonetic-clusters/PhoneticClustersPage";
import { ReadersPage } from "../features/readers";
import { usePhaseGate } from "shared/hooks";
import type { ReactNode } from "react";

/**
 * Route-level phase gate: only renders children if the user's phase >= requiredPhase.
 * Redirects to foundations if the user hasn't unlocked this content yet.
 */
function PhaseGate({ requiredPhase, children }: { requiredPhase: number; children: ReactNode }) {
  const { phaseGate, isLoading } = usePhaseGate();

  // During loading, render nothing (Layout's Skeleton handles the visual)
  if (isLoading) return null;

  const currentPhase = phaseGate?.currentPhase ?? 1;

  if (currentPhase < requiredPhase) {
    return <Navigate to="/learn/foundations" replace />;
  }

  return <>{children}</>;
}

export function LearnRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<Navigate to="/learn/foundations" replace />} />
        <Route path="foundations" element={<FoundationsPage />} />
        {/* Future content type placeholders */}
        <Route path="radicals" element={<RadicalsPage />} />
        <Route
          path="grammar"
          element={
            <PhaseGate requiredPhase={2}>
              <GrammarPage />
            </PhaseGate>
          }
        />
        <Route path="phonetic-clusters" element={<PhoneticClustersPage />} />
        <Route
          path="readers"
          element={
            <PhaseGate requiredPhase={3}>
              <ReadersPage mode="library" />
            </PhaseGate>
          }
        />
        <Route
          path="chengyu"
          element={
            <PhaseGate requiredPhase={4}>
              <ChengyuPage />
            </PhaseGate>
          }
        />
        {/* Lexical session === routed detail surface (Focus). The entity bodies
            render exactly as they did in the old overlay; the shell is a route. */}
        <Route path={lexical_entity_route} element={<LexicalEntityPage />} />
        {/* Redirect old routes */}
        <Route path="flashcards/*" element={<Navigate to="/learn/foundations" replace />} />
        <Route path="quiz" element={<Navigate to={practices_quiz} replace />} />
        <Route path="review" element={<Navigate to={practices_review} replace />} />
        <Route path="basic" element={<Navigate to="/learn/foundations" replace />} />
      </Route>
    </Routes>
  );
}
