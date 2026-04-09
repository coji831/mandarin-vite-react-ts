import { describe, it, expect } from "vitest";
import { validateAndCanonicalize } from "../../src/services/examples/inputSanitizer.js";

describe("Input sanitizer - prompt injection protections", () => {
  it("rejects null bytes in word", () => {
    expect(() => validateAndCanonicalize({ word: "abc\u0000def", hskLevel: 1 })).toThrow();
  });

  it("rejects SQL-like strings", () => {
    expect(() => validateAndCanonicalize({ word: "DROP TABLE users;", hskLevel: 1 })).toThrow();
  });

  it("rejects script tags", () => {
    expect(() =>
      validateAndCanonicalize({ word: "<script>alert(1)</script>", hskLevel: 1 }),
    ).toThrow();
  });
});
