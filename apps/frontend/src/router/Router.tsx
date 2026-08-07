/**
 * Router.tsx — Main application router
 *
 * Defines the top-level routing structure for the entire application:
 * - Wraps all authenticated routes in AppLayout (global nav)
 * - Routes: / (Dashboard), /dashboard (Dashboard alias), /learn/* (LearnRoutes),
 *           /practices/* (PracticesRoutes), /library (LibraryPage),
 *           /progress (ProgressPage), /auth (login/register)
 *
 * Story 17.7: Added /practices/* and /library routes.
 * VisFix W6b: Added /dashboard as an alias for the dashboard (index stays at /).
 */

import { Route, Routes } from "react-router-dom";
import {
  learn_page,
  root,
  dashboard_route,
  login_page,
  register_page,
  profile_page,
  settings_page,
} from "shared/constants";
import { LearnRoutes } from "./LearnRoutes";
import { AppLayout } from "../shared/layouts/AppLayout";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { PracticesRoutes } from "./PracticesRoutes";
import LibraryPage from "../pages/LibraryPage";
import { ProgressPage } from "../pages/ProgressPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";

function MainRoutes() {
  return (
    <Routes>
      <Route path={root} element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path={dashboard_route} element={<DashboardPage />} />
        <Route path={learn_page + "/*"} element={<LearnRoutes />} />
        <Route path="practices/*" element={<PracticesRoutes />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path={profile_page} element={<ProfilePage />} />
        <Route path={settings_page} element={<SettingsPage />} />
        <Route path={login_page} element={<LoginPage />} />
        <Route path={register_page} element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}

export default MainRoutes;
