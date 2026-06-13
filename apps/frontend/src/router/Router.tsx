import { Route, Routes } from "react-router-dom";
import { learn_page, root, auth_page, login_page, register_page } from "../shared/constants/paths";
import { LearnRoutes } from "./LearnRoutes";
import { ProtectedRoute } from "../features/auth";
import { AppLayout } from "../shared/layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
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
