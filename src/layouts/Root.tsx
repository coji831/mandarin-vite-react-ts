import { Link, Outlet } from "react-router-dom";
import { todo_page, root } from "../constants/paths";

function Root() {
  return (
    <div id="root-layout">
      <div id="nav-bar">
        <div className="nav-bar-item">
          <Link to={root}>
            <button>Home</button>
          </Link>
        </div>
        <div className="nav-bar-item">
          <Link to={todo_page}>
            <button>Todo</button>
          </Link>
        </div>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default Root;
