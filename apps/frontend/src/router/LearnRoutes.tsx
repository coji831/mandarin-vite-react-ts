/**
 * LearnRoutes.tsx
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout (nav-less since Story 22.4 — Learn tabs live in the
 *   sidebar's phase-gated Learn group)
 * - Index route redirects to /learn/foundations
 * - ALL six Learn content routes pass through ONE data-driven phase gate
 *   (`LearnRouteGate`) that derives `requiredPhase` from `LEARN_REQUIRED_PHASE`
 *   (single source of truth in `shared/constants/learnNav.ts`)
 * - Old routes (flashcards, basic) redirect to /learn/foundations
 *
 * Epic 25 Phase A: the gate is no longer a redirect-only, hardcoded
 * grammar/readers/chengyu wrapper. It now covers foundations/radicals/
 * grammar/phonetic-clusters/readers/chengyu (closing the radicals +
 * phonetic-clusters URL bypass) and renders the shared LockedSurface gate
 * screen on below-phase direct navigation (guest or authed) instead of the
 * silent redirect-to-foundations.
 *
 * Story 18.1: Replaced ContentBrowser index with phase-gated route navigation.
 * ContentBrowser still works at /library for freeroam browsing.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { practices_quiz, practices_review, LEARN_NAV_ITEMS } from "shared/constants";
import { LearnLayout } from "../shared/layouts/LearnLayout";
import {
  FoundationsPage,
  RadicalsPage,
  GrammarPage,
  ChengyuPage,
} from "../pages/learn/foundations";
import { PhoneticClustersPage } from "../pages/learn/phonetic-clusters/PhoneticClustersPage";
import { ReadersPage } from "../features/readers";
import { usePhaseGate } from "shared/hooks";
import { LockedSurface } from "shared/components";
import type { ReactNode } from "react";

/**
 * The single data-driven Learn route gate (Epic 25 Phase A). Derives the
 * content's `label` + `requiredPhase` from `LEARN_NAV_ITEMS` by route id so
 * the route gate can never drift from the sidebar lock logic (which consumes
 * the same constant).
 *
 * Below-phase direct navigation — guest or authed — renders the shared
 * LockedSurface gate screen (neutral "X unlocks in Phase N" copy, no CTA)
 * instead of redirecting to foundations. Foundations (requiredPhase 1) always
 * renders, so it stays the guest/Phase-1 landing.
 */
function LearnRouteGate({ routeId, children }: { routeId: string; children: ReactNode }) {
  const { phaseGate, isLoading } = usePhaseGate();
  const navItem = LEARN_NAV_ITEMS.find((item) => item.id === routeId);
  const requiredPhase = navItem?.requiredPhase ?? 1;

  // During loading, render nothing (the app shell provides the chrome; pages
  // own their own skeleton states after the gate resolves).
  if (isLoading) return null;

  const currentPhase = phaseGate?.currentPhase ?? 1;

  if (currentPhase < requiredPhase) {
    return <LockedSurface label={navItem?.label ?? "This content"} requiredPhase={requiredPhase} />;
  }

  return <>{children}</>;
}

/**
 * Every Learn content route + its `LEARN_NAV_ITEMS` id. Rendering each through
 * `<LearnRouteGate routeId>` keeps gating data-driven for ALL six routes — no
 * per-route hardcoded phase numbers (the old radicals/phonetic-clusters bypass
 * came from omitting the gate entirely).
 */
const LEARN_ROUTE_CONFIG: { id: string; path: string; element: ReactNode }[] = [
  { id: "foundations", path: "foundations", element: <FoundationsPage /> },
  { id: "radicals", path: "radicals", element: <RadicalsPage /> },
  { id: "grammar", path: "grammar", element: <GrammarPage /> },
  { id: "phonetic", path: "phonetic-clusters", element: <PhoneticClustersPage /> },
  { id: "readers", path: "readers", element: <ReadersPage mode="library" /> },
  { id: "chengyu", path: "chengyu", element: <ChengyuPage /> },
];

export function LearnRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<Navigate to="/learn/foundations" replace />} />
        {LEARN_ROUTE_CONFIG.map(({ id, path, element }) => (
          <Route
            key={path}
            path={path}
            element={<LearnRouteGate routeId={id}>{element}</LearnRouteGate>}
          />
        ))}
        {/* Redirect old routes */}
        <Route path="flashcards/*" element={<Navigate to="/learn/foundations" replace />} />
        <Route path="quiz" element={<Navigate to={practices_quiz} replace />} />
        <Route path="review" element={<Navigate to={practices_review} replace />} />
        <Route path="basic" element={<Navigate to="/learn/foundations" replace />} />
      </Route>
    </Routes>
  );
}
