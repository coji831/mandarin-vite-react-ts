import "@testing-library/jest-dom";

// Polyfill TextEncoder for test environment (jsdom)
// Use require to avoid type conflicts in TypeScript
const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

// Lightweight fetch mock for Node/Jest environment. Some tests render
// components that call `fetch`; in the browser environment fetch exists,
// but in Node/Jest it's undefined which causes noisy console errors.
// Provide a guarded mock so tests can optionally spy on calls.
if (typeof (global as any).fetch === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = jest.fn(() => Promise.resolve({ json: () => ({}) }));
}
