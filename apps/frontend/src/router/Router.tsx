import { Route, Routes } from "react-router-dom";
import { mandarin_page, root, todo_page, auth_page } from "../constants/paths";
import { MandarinRoutes } from "../features/mandarin/router/MandarinRoutes";
import { AuthPage, ProtectedRoute } from "../features/auth";
import Root from "../layouts/Root";
import Home from "../pages/Home";
import Todo from "../pages/Todo";

function MainRoutes() {
  return (
    <Routes>
      <Route path={root} element={<Root />}>
        <Route element={<Home />} index></Route>
        <Route
          path={mandarin_page + "/*"}
          element={
            <ProtectedRoute>
              <MandarinRoutes />
            </ProtectedRoute>
          }
        />
        <Route path={auth_page} element={<AuthPage />} />
        <Route element={<Todo />} path={todo_page}></Route>
      </Route>
    </Routes>
  );
}

export default MainRoutes;
