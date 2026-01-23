/**
 * AuthPage - Combined auth page with tab switching
 */

import { useState } from "react";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { useNavigate } from "react-router-dom";
import { mandarin_page } from "../../../constants/paths";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(mandarin_page);
  };

  return (
    <div style={{ padding: "2rem 0" }}>
      {mode === "login" ? (
        <LoginForm onSuccess={handleSuccess} onSwitchToRegister={() => setMode("register")} />
      ) : (
        <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => setMode("login")} />
      )}
    </div>
  );
}
