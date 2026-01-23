// apps/backend/tests/unit/errorHandler.test.js
// Test for errorHandler and requestIdMiddleware

import { describe, test, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { requestIdMiddleware, errorHandler } from "../../src/api/middleware/errorHandler.js";

describe("errorHandler middleware", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(requestIdMiddleware);
    app.get("/fail", (req, res, next) => {
      const err = new Error("Test error");
      err.status = 418;
      err.code = "TEAPOT";
      next(err);
    });
    app.use(errorHandler);
  });

  it("should return structured error with requestId", async () => {
    const res = await request(app).get("/fail");
    expect(res.status).toBe(418);
    expect(res.body).toHaveProperty("code", "TEAPOT");
    expect(res.body).toHaveProperty("message", "Test error");
    expect(res.body).toHaveProperty("requestId");
    expect(res.headers).toHaveProperty("x-request-id");
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  it("should generate requestId if not provided", async () => {
    const res = await request(app).get("/fail");
    expect(res.body.requestId).toBeDefined();
  });
});
