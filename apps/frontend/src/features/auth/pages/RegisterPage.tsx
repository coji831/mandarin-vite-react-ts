/**
 * RegisterPage - Registration page with optional switch to login
 */

import { useNavigate } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";
import { dashboard_page } from "../../../constants/paths";

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(dashboard_page);
  };

  const handleSwitchToLogin = () => {
    navigate("/auth/login");
  };

  return (
    <div style={{ padding: "2rem 0" }}>
      <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  );
}
