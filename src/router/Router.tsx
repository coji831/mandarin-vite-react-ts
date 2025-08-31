import { Route, Routes } from "react-router";
import { mandarin_page, root, todo_page } from "../constants/paths";
import { ProgressProvider } from "../features/mandarin/context/ProgressContext";
import { Mandarin } from "../features/mandarin/pages/Mandarin";
import Root from "../layouts/Root";
import Home from "../pages/Home";
import Todo from "../pages/Todo";

function MainRoutes() {
  return (
    <Routes>
      <Route path={root} element={<Root />}>
        <Route element={<Home />} index></Route>
        <Route
          element={
            <ProgressProvider>
              <Mandarin />
            </ProgressProvider>
          }
          path={mandarin_page}
        ></Route>
        <Route element={<Todo />} path={todo_page}></Route>
      </Route>
    </Routes>
  );
}

export default MainRoutes;
