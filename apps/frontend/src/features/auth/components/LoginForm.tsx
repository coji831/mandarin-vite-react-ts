/**
 * LoginForm component - User login interface
 * Styled to match app theme (#646cff primary color, dark mode)
 */

import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Box, Button, Input, TextLink } from "shared/components";
import "./AuthForm.css";

type LoginFormProps = {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
};

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
    <form className="auth-form  p-xl flex-center " onSubmit={handleSubmit}>
      <Box variant="elevated" padding="xl" className="auth-form-container w-full flex-col gap-lg">
        <h2 className="text-primary font-2xl fw-600 text-center">Login</h2>

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
        </div>

        <Button variant="primary" type="submit" loading={isLoading} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>

        {onSwitchToRegister && (
          <div className="text-center text-tertiary font-sm">
            Don't have an account? <TextLink onClick={onSwitchToRegister}>Register</TextLink>
          </div>
        )}
      </Box>
    </form>
  );
}
