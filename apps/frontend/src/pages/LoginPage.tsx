/**
 * LoginPage - Authentication login page
 * Split from AuthPage during frontend modulith migration
 */
import { LoginForm } from "../features/auth";
import { useNavigate } from "react-router-dom";
import { dashboard_page, register_page } from "../shared/constants/paths";

export function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(dashboard_page);
  };

  const handleSwitchToRegister = () => {
    navigate(register_page);
  };

  return (
    <div style={{ padding: "2rem 0" }}>
      <LoginForm onSuccess={handleSuccess} onSwitchToRegister={handleSwitchToRegister} />
    </div>
  );
}
