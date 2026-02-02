import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Comprehensive cleanup after each test (industry standard)
afterEach(() => {
  cleanup();
  // Mocks are auto-reset via vitest config (clearMocks, mockReset, restoreMocks)
});

// Mock window.matchMedia (required for many component tests)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (common for lazy loading, animations)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock ResizeObserver (common for responsive components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Note: Do NOT mock fetch globally - mock per-test when needed
// Example per-test mock: global.fetch = vi.fn(() => Promise.resolve({ json: () => ({}) }))
