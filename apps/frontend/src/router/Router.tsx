import { Route, Routes } from "react-router-dom";
import { learn_page, root, auth_page } from "../constants/paths";
import { MandarinRoutes } from "../features/mandarin/router/MandarinRoutes";
import { AuthPage, ProtectedRoute } from "../features/auth";
import { AppLayout } from "../layouts/AppLayout";
import { Dashboard } from "../pages/Dashboard";
import { ProgressPage } from "../pages/ProgressPage";

function MainRoutes() {
  return (
    <Routes>
      <Route path={root} element={<AppLayout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path={learn_page + "/*"}
          element={
            <ProtectedRoute>
              <MandarinRoutes />
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
        <Route path={auth_page} element={<AuthPage />} />
      </Route>
    </Routes>
  );
}

export default MainRoutes;
