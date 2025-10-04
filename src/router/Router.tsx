import { Route, Routes } from "react-router-dom";
import { mandarin_page, root, todo_page } from "../constants/paths";
import { ProgressProvider } from "../features/mandarin/context/ProgressContext";
import { MandarinRoutes } from "../features/mandarin/router/MandarinRoutes";
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
            <ProgressProvider>
              <MandarinRoutes />
            </ProgressProvider>
          }
        />
        <Route element={<Todo />} path={todo_page}></Route>
      </Route>
    </Routes>
  );
}

export default MainRoutes;
