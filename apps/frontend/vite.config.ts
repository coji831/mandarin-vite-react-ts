/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Type-safe with Vitest 4.x (Vite 6 compatible)
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  publicDir: path.resolve(__dirname, "public"),
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
      config: path.resolve(__dirname, "src/config"),
      services: path.resolve(__dirname, "src/services"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            // Forward cookies from client to backend
            // @ts-expect-error: _req is intentionally unused
            if (proxyReq.getHeader && proxyReq.setHeader) {
              // This is just a placeholder for the example
            }
          });
          proxy.on("proxyRes", (proxyRes, _req, res) => {
            // Forward Set-Cookie headers from backend to client
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              res.setHeader("set-cookie", setCookie);
            }
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true,
    // Include all test files
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Auto-reset mocks between tests (industry standard)
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    // Reasonable timeout for most tests
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "dist/",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        branches: 40,
        functions: 40,
        lines: 40,
        statements: 40,
        // TODO: Gradually increase to 70%+ for new code
      },
    },
  },
});
