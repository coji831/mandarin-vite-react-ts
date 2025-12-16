/**
 * RegisterForm component - User registration interface
 * Styled to match app theme (#646cff primary color, dark mode)
 */

import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthForm.css";

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export function RegisterForm({ onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least 1 uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least 1 lowercase letter";
    }
    if (!/\d/.test(pwd)) {
      return "Password must contain at least 1 digit";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-title">Create Account</h2>

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
          <label htmlFor="displayName" className="auth-form-label">
            Display Name (Optional)
          </label>
          <input
            id="displayName"
            type="text"
            className="auth-form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            placeholder="Your Name"
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
          <div className="auth-form-hint">
            Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit
          </div>
        </div>

        <div className="auth-form-field">
          <label htmlFor="confirmPassword" className="auth-form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="auth-form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="auth-form-button primary" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Register"}
        </button>

        {onSwitchToLogin && (
          <div className="auth-form-footer">
            Already have an account?{" "}
            <button
              type="button"
              className="auth-form-link"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Login
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
