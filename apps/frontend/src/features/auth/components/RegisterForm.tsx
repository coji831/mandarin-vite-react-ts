/**
 * RegisterForm component - User registration interface
 * Styled to match app theme (#646cff primary color, dark mode)
 */

import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Box, Button, Input, TextLink } from "shared/components";
import "./AuthForm.css";

type RegisterFormProps = {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
};

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
    <form className="auth-form flex-center p-xl" onSubmit={handleSubmit}>
      <Box variant="elevated" padding="xl" className="auth-form-container w-full flex-col gap-lg">
        <h2 className="text-primary font-2xl fw-600 text-center">Create Account</h2>

        {error && (
          <Box variant="error" className="auth-form-error bg-error-bg text-error font-sm">
            {error}
          </Box>
        )}

        <div>
          <label htmlFor="email" className="auth-form-label text-secondary font-sm fw-500">
            Email
          </label>
          <Input
            id="email"
            type="email"
            className="p-sm transition-normal w-full font-md text-primary bg-surface-dark radius-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label htmlFor="displayName" className="auth-form-label text-secondary font-sm fw-500">
            Display Name (Optional)
          </label>
          <Input
            id="displayName"
            type="text"
            className="p-sm transition-normal w-full font-md text-primary bg-surface-dark radius-md"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            placeholder="Your Name"
          />
        </div>

        <div>
          <label htmlFor="password" className="auth-form-label text-secondary font-sm fw-500">
            Password
          </label>
          <Input
            id="password"
            type="password"
            className="p-sm transition-normal w-full font-md text-primary bg-surface-dark radius-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="••••••••"
          />
          <div className="text-tertiary font-xs">
            Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="auth-form-label text-secondary font-sm fw-500"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            className="p-sm transition-normal w-full font-md text-primary bg-surface-dark radius-md"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>

        <Button variant="primary" type="submit" loading={isLoading} disabled={isLoading}>
          {isLoading ? "Creating account..." : "Register"}
        </Button>

        {onSwitchToLogin && (
          <div className="text-center text-tertiary font-sm">
            Already have an account? <TextLink onClick={onSwitchToLogin}>Login</TextLink>
          </div>
        )}
      </Box>
    </form>
  );
}
