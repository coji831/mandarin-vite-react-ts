/**
 * RegisterPage - Authentication registration page
 * Split from AuthPage during frontend modulith migration
 */
import { RegisterForm } from "../features/auth";
import { useNavigate } from "react-router-dom";
import { dashboard_page, login_page } from "shared/constants";

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(dashboard_page);
  };

  const handleSwitchToLogin = () => {
    navigate(login_page);
  };

  return (
    <div className="p-xl">
      <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  );
}
