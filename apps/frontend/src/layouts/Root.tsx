import { Link, Outlet } from "react-router-dom";
import { todo_page, root, mandarin_page, auth_page } from "../constants/paths";
import { useAuth } from "../features/auth";

function Root() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div id="root-layout">
      <div id="nav-bar">
        <div className="nav-bar-item">
          <Link to={root}>
            <button>Home</button>
          </Link>
        </div>
        <div className="nav-bar-item">
          <Link to={mandarin_page}>
            <button>Mandarin</button>
          </Link>
        </div>
        <div className="nav-bar-item">
          <Link to={todo_page}>
            <button>Todo</button>
          </Link>
        </div>
        <div className="nav-bar-item" style={{ marginLeft: "auto" }}>
          {isAuthenticated ? (
            <>
              <span style={{ color: "#b3c7ff", marginRight: "1rem" }}>
                {user?.displayName || user?.email}
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to={auth_page}>
              <button className="primary">Login</button>
            </Link>
          )}
        </div>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default Root;
