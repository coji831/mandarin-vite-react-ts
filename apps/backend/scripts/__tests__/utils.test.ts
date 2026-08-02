/**
 * @file apps/backend/scripts/__tests__/utils.test.ts
 * @description Unit tests for shared script utilities
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// Import the functions directly
// Note: Some functions like loadEnv() interact with the environment and are
// harder to unit test. Focus on writeJsonAtomic and ensureDir.

// We'll test via dynamic import since the module uses ESM
// and we need to avoid side effects from loadEnv()

describe("writeJsonAtomic", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "script-utils-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should write a JSON file atomically", async () => {
    const { writeJsonAtomic } = await import("../utils.js");
    const filePath = path.join(tmpDir, "test.json");
    const data = { key: "value", num: 42 };

    writeJsonAtomic(filePath, data);

    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(content).toEqual(data);
  });

  it("should not leave .tmp files behind", async () => {
    const { writeJsonAtomic } = await import("../utils.js");
    const filePath = path.join(tmpDir, "clean.json");

    writeJsonAtomic(filePath, { test: true });

    const files = fs.readdirSync(tmpDir);
    expect(files).toEqual(["clean.json"]);
  });

  it("should overwrite existing file", async () => {
    const { writeJsonAtomic } = await import("../utils.js");
    const filePath = path.join(tmpDir, "overwrite.json");

    writeJsonAtomic(filePath, { version: 1 });
    writeJsonAtomic(filePath, { version: 2 });

    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(content).toEqual({ version: 2 });
  });
});

describe("ensureDir", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "script-utils-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should create a directory that doesn't exist", async () => {
    const { ensureDir } = await import("../utils.js");
    const dir = path.join(tmpDir, "new", "nested", "dir");

    ensureDir(dir);

    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.statSync(dir).isDirectory()).toBe(true);
  });

  it("should not throw if directory already exists", async () => {
    const { ensureDir } = await import("../utils.js");
    fs.mkdirSync(tmpDir, { recursive: true });

    expect(() => ensureDir(tmpDir)).not.toThrow();
  });
});
