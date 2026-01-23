/**
 * LoginForm component - User login interface
 * Styled to match app theme (#646cff primary color, dark mode)
 */

import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthForm.css";

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-title">Login</h2>

        {error && <div className="auth-form-error">{error}</div>}

        <div className="auth-form-field">
          <label htmlFor="email" className="auth-form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="auth-form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="your.email@example.com"
          />
        </div>

        <div className="auth-form-field">
          <label htmlFor="password" className="auth-form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="auth-form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="auth-form-button primary" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {onSwitchToRegister && (
          <div className="auth-form-footer">
            Don't have an account?{" "}
            <button
              type="button"
              className="auth-form-link"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Register
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
