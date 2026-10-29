/**
 * LearnRoutes.tsx
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout (nav-less since Story 22.4 — Learn tabs live in the
 *   sidebar's Learn group)
 * - Index route redirects to /learn/foundations
 * - Each content type has its own route (dedicated page or placeholder)
 * - Old routes (flashcards, basic) redirect to /learn/foundations
 *
 * Story 18.1: Replaced ContentBrowser index with route navigation.
 * ContentBrowser still works at /library for freeroam browsing.
 * S2 (session = route, not modal): `hub/:entityType/:entityId` is the routed
 * Focus surface that hosts a lexical detail — a learning session is a route,
 * never an overlay (design-revalidation-guide.md §4).
 *
 * Story 25-3 / A25 (BM-1 §3, L6): EVERY Learn route renders for EVERY visitor
 * — a guest gets "Learn — all content … browse/demo (no lock)". The local
 * `PhaseGate` helper and its three wrappers (grammar / readers / chengyu) were
 * deleted here; the aliases and the index redirect are unaffected. Phase is
 * sequencing metadata only (`shared/constants/learnNav.ts`) and no route may
 * turn it into a prerequisite again.
 *
 * Rework (epic-25): there is no `/learn/hub/:entityType/:entityId` route. A
 * lexical lookup is a PEEK, not a location (rework-proposal §0.6): the sheet is
 * mounted once in AppLayout and hops live in a store stack, so the breadth is
 * de-routed and the URL never becomes `/learn/hub/...`.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { practices_quiz, practices_review } from "shared/constants";
import { LearnLayout } from "../shared/layouts/LearnLayout";
import {
  FoundationsPage,
  RadicalsPage,
  GrammarPage,
  ChengyuPage,
} from "../pages/learn/foundations";
import { PhoneticClustersPage } from "../pages/learn/phonetic-clusters/PhoneticClustersPage";
import { ReadersPage } from "../features/readers";

export function LearnRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<Navigate to="/learn/foundations" replace />} />
        <Route path="foundations" element={<FoundationsPage />} />
        {/* Future content type placeholders */}
        <Route path="radicals" element={<RadicalsPage />} />
        <Route path="grammar" element={<GrammarPage />} />
        <Route path="phonetic-clusters" element={<PhoneticClustersPage />} />
        <Route path="readers" element={<ReadersPage mode="library" />} />
        <Route path="chengyu" element={<ChengyuPage />} />
        {/* Redirect old routes */}
        <Route path="flashcards/*" element={<Navigate to="/learn/foundations" replace />} />
        <Route path="quiz" element={<Navigate to={practices_quiz} replace />} />
        <Route path="review" element={<Navigate to={practices_review} replace />} />
        <Route path="basic" element={<Navigate to="/learn/foundations" replace />} />
      </Route>
    </Routes>
  );
}
