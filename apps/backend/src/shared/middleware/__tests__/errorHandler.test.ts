// apps/backend/src/shared/middleware/__tests__/errorHandler.test.ts
// Test for requestIdMiddleware (the Express errorHandler's envelope is
// reproduced by the Nest AppExceptionFilter, covered by the integration
// parity harness).

import { describe, test, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { requestIdMiddleware } from "../errorHandler.js";

describe("requestIdMiddleware", () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    app.use(requestIdMiddleware);
    app.get("/ok", (_req, res) => {
      res.status(200).json({ ok: true });
    });
  });

  test("sets X-Request-Id on the response", async () => {
    const res = await request(app).get("/ok");
    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("x-request-id");
  });

  test("generates a requestId when the client does not supply one", async () => {
    const res = await request(app).get("/ok");
    expect(res.body.requestId).toBeUndefined(); // requestId lives on req, not body
    expect(typeof res.headers["x-request-id"]).toBe("string");
  });

  test("echoes a client-supplied X-Request-Id", async () => {
    const res = await request(app).get("/ok").set("X-Request-Id", "client-rid-1");
    expect(res.headers["x-request-id"]).toBe("client-rid-1");
  });
});
