/**
 * @file GuestUpsell.test.tsx
 * @description Component tests for the GuestUpsell upsell card.
 * Bug 2: verifies the presentational primitive renders copy and its CTA
 * navigates to the register page by default (custom label/target honored).
 */
/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestUpsell } from "../GuestUpsell";
import { register_page } from "shared/constants";

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("GuestUpsell", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders title and description", () => {
    render(<GuestUpsell title="Mnemonic stories" description="Register to generate your own." />);
    expect(screen.getByText("Mnemonic stories")).toBeInTheDocument();
    expect(screen.getByText("Register to generate your own.")).toBeInTheDocument();
  });

  it("renders icon prefix when provided", () => {
    render(<GuestUpsell title="Mnemonic stories" description="Desc" icon="🔒" />);
    expect(screen.getByText("🔒 Mnemonic stories")).toBeInTheDocument();
  });

  it("default CTA navigates to the register page", () => {
    render(<GuestUpsell title="T" description="D" />);
    const cta = screen.getByRole("button", { name: "Create an account to unlock ▸" });
    fireEvent.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith(register_page);
  });

  it("honors a custom ctaLabel", () => {
    render(<GuestUpsell title="T" description="D" ctaLabel="Sign in again ▸" />);
    expect(screen.getByRole("button", { name: "Sign in again ▸" })).toBeInTheDocument();
  });

  it("honors a custom navigation target", () => {
    render(<GuestUpsell title="T" description="D" to="/auth/login" />);
    fireEvent.click(screen.getByRole("button", { name: "Create an account to unlock ▸" }));
    expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
  });
});
