/**
 * Tests for axiosClient
 * Comprehensive coverage: config, error handling, request transformation
 *
 * Story 14.2a: Industry-standard test coverage using axios-mock-adapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../axiosClient";
import { API_CONFIG } from "../../config/api";
import type { NormalizedError } from "@mandarin/shared-types";

describe("axiosClient", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    // Clear console.error spy between tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  describe("Configuration", () => {
    it("should be configured with correct baseURL", () => {
      expect(apiClient.defaults.baseURL).toBe(API_CONFIG.baseURL);
    });

    it("should be configured with correct timeout", () => {
      expect(apiClient.defaults.timeout).toBe(API_CONFIG.timeout);
    });

    it("should be configured with withCredentials from API_CONFIG", () => {
      expect(apiClient.defaults.withCredentials).toBe(API_CONFIG.withCredentials);
    });

    it("should have Content-Type header set to application/json", () => {
      expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("Request Transformation", () => {
    it("should automatically add Content-Type header to requests", async () => {
      mock.onPost("/test").reply((config) => {
        expect(config.headers!["Content-Type"]).toBe("application/json");
        return [200, { success: true, data: {} }];
      });

      await apiClient.post("/test", { data: "test" });
    });

    it("should send JSON body correctly", async () => {
      const testData = { name: "Alice", age: 30 };

      mock.onPost("/test").reply((config) => {
        expect(JSON.parse(config.data)).toEqual(testData);
        return [200, { success: true, data: {} }];
      });

      await apiClient.post("/test", testData);
    });

    it("should include credentials in requests when withCredentials is true", async () => {
      if (API_CONFIG.withCredentials) {
        mock.onGet("/test").reply((config) => {
          expect(config.withCredentials).toBe(true);
          return [200, { success: true, data: {} }];
        });

        await apiClient.get("/test");
      } else {
        // If withCredentials is false (untrusted domain), verify it's false
        expect(apiClient.defaults.withCredentials).toBe(false);
      }
    });
  });

  describe("Error Handling - Network Errors", () => {
    it("should normalize timeout errors", async () => {
      mock.onGet("/slow").timeout();

      try {
        await apiClient.get("/slow");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.code).toBe("ECONNABORTED");
        expect(normalized.message).toContain("timeout");
        expect(normalized.originalError).toBeDefined();
      }
    });

    it("should normalize network errors", async () => {
      mock.onGet("/network-error").networkError();

      try {
        await apiClient.get("/network-error");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.code).toBe("ERR_NETWORK");
        expect(normalized.message).toBeTruthy();
        expect(normalized.originalError).toBeDefined();
      }
    });
  });

  describe("Error Handling - HTTP Errors", () => {
    it("should normalize 500 server errors", async () => {
      mock.onGet("/server-error").reply(500, {
        message: "Internal server error",
      });

      try {
        await apiClient.get("/server-error");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.status).toBe(500);
        expect(normalized.message).toBe("Internal server error");
        expect(normalized.originalError).toBeDefined();
      }
    });

    it("should normalize 404 not found errors", async () => {
      mock.onGet("/not-found").reply(404, {
        message: "Resource not found",
      });

      try {
        await apiClient.get("/not-found");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.status).toBe(404);
        expect(normalized.message).toBe("Resource not found");
      }
    });

    it("should use fallback message if response has no message", async () => {
      mock.onGet("/error-no-message").reply(400, {});

      try {
        await apiClient.get("/error-no-message");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.status).toBe(400);
        expect(normalized.message).toBe("An unexpected error occurred");
      }
    });

    it("should log errors to console", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      mock.onGet("/error").reply(500, { message: "Server error" });

      try {
        await apiClient.get("/error");
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[apiClient] Request failed:",
        expect.objectContaining({
          url: "/error",
          method: "GET",
          status: 500,
          message: "Server error",
        }),
      );
    });
  });

  describe("Successful Requests", () => {
    it("should handle successful GET requests", async () => {
      mock.onGet("/success").reply(200, {
        success: true,
        data: { id: "123", name: "Test" },
      });

      const response = await apiClient.get("/success");

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true,
        data: { id: "123", name: "Test" },
      });
    });

    it("should handle successful POST requests", async () => {
      mock.onPost("/create").reply(201, {
        success: true,
        data: { id: "456" },
      });

      const response = await apiClient.post("/create", { name: "New Item" });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should support generic type parameters", async () => {
      interface TestData {
        id: string;
        value: number;
      }

      mock.onGet("/typed").reply(200, {
        success: true,
        data: { id: "789", value: 42 },
      });

      // TypeScript will enforce this at compile time
      const response = await apiClient.get<{ success: boolean; data: TestData }>("/typed");

      expect(response.data.data.id).toBe("789");
      expect(response.data.data.value).toBe(42);
    });
  });

  describe("Exports", () => {
    it("should export named apiClient", () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe("function");
    });

    it("should export default export", async () => {
      const defaultImport = (await import("../axiosClient")).default;
      expect(defaultImport).toBe(apiClient);
    });
  });

  describe("Auth Interceptors (Story 14.3)", () => {
    beforeEach(() => {
      localStorage.clear();
      vi.clearAllMocks();
    });

    it("should add Authorization header when token exists", async () => {
      const validToken = createMockJWT({ exp: Date.now() / 1000 + 3600 }); // Valid 1h
      localStorage.setItem("accessToken", validToken);

      mock.onGet("/protected").reply((config) => {
        expect(config.headers!.Authorization).toBe(`Bearer ${validToken}`);
        return [200, { success: true, data: {} }];
      });

      await apiClient.get("/protected");
    });

    it("should make request without Authorization header when no token", async () => {
      mock.onGet("/public").reply((config) => {
        expect(config.headers!.Authorization).toBeUndefined();
        return [200, { success: true, data: {} }];
      });

      await apiClient.get("/public");
    });

    it("should handle 401 error and normalize message", async () => {
      localStorage.setItem("accessToken", "invalid-token");

      mock.onGet("/protected").reply(401, { message: "Token invalid" });
      mock.onPost("/api/v1/auth/refresh").reply(401, { message: "Refresh failed" });

      try {
        await apiClient.get("/protected");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.status).toBe(401);
        expect(normalized.message).toBe("Token invalid");
      }
    });
  });

  describe("Network Retry Logic (Story 14.3)", () => {
    it("should handle network errors gracefully", async () => {
      mock.onGet("/network-fail").networkError();

      try {
        await apiClient.get("/network-fail");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.code).toBe("ERR_NETWORK");
        expect(normalized.message).toBeTruthy();
      }
    });

    it("should normalize timeout errors with proper code", async () => {
      mock.onGet("/timeout").timeout();

      try {
        await apiClient.get("/timeout");
        expect.fail("Should have thrown error");
      } catch (error) {
        const normalized = error as NormalizedError;
        expect(normalized.code).toBe("ECONNABORTED");
        expect(normalized.message).toContain("timeout");
      }
    });
  });
});

// Helper: Create mock JWT
function createMockJWT(payload: { exp: number }): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = "mock-signature";
  return `${header}.${body}.${signature}`;
}
