/**
 * LoginPage - Login page with optional switch to register
 */

import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { dashboard_page } from "../../../constants/paths";

export function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(dashboard_page);
  };

  const handleSwitchToRegister = () => {
    navigate("/auth/register");
  };

  return (
    <div style={{ padding: "2rem 0" }}>
      <LoginForm onSuccess={handleSuccess} onSwitchToRegister={handleSwitchToRegister} />
    </div>
  );
}
