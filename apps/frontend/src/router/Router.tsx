/**
 * Router.tsx — Main application router
 *
 * Defines the top-level routing structure for the entire application:
 * - Wraps all authenticated routes in AppLayout (global nav)
 * - Routes: / (Dashboard), /learn/* (LearnRoutes), /practices/* (PracticesRoutes),
 *           /library (LibraryPage), /progress (ProgressPage), /auth (login/register)
 *
 * Story 17.7: Added /practices/* and /library routes.
 */

import { Route, Routes } from "react-router-dom";
import { learn_page, root, auth_page, login_page, register_page } from "../shared/constants/paths";
import { LearnRoutes } from "./LearnRoutes";
import { ProtectedRoute } from "../features/auth";
import { AppLayout } from "../shared/layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { PracticesRoutes } from "./PracticesRoutes";
import LibraryPage from "../pages/LibraryPage";
import { ProgressPage } from "../pages/ProgressPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";

function MainRoutes() {
  return (
    <Routes>
      <Route path={root} element={<AppLayout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path={learn_page + "/*"}
          element={
            <ProtectedRoute>
              <LearnRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="practices/*"
          element={
            <ProtectedRoute>
              <PracticesRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route path={login_page} element={<LoginPage />} />
        <Route path={register_page} element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}

export default MainRoutes;
