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
