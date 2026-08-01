/**
 * @file features/auth/components/__tests__/LoginForm.test.tsx
 * @description Tests for LoginForm — login error announced via role="alert" (WCAG).
 * VisFix W4: the error box is a live region (role="alert") so screen readers
 * announce "Failed to authenticate" immediately.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn().mockRejectedValue(new Error("Invalid email or password")),
  }),
}));

describe("LoginForm", () => {
  it("renders the login error inside an alert live region", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /login/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Invalid email or password");
  });

  it("shows no alert before a failed submission", () => {
    render(<LoginForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
