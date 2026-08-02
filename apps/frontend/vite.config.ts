import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";

// https://vitejs.dev/config/
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  // Type-safe with Vitest 4.x (Vite 6 compatible)
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  publicDir: path.resolve(__dirname, "public"),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep shared/ modules together to prevent circular dependency
          // warnings when feature chunks import from shared barrels that
          // re-export from internal source files.
          if (id.includes("/src/shared/") && !id.includes("node_modules")) {
            return "shared";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      features: path.resolve(__dirname, "src/features"),
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
      config: path.resolve(__dirname, "src/shared/config"),
      shared: path.resolve(__dirname, "src/shared"),
      services: path.resolve(__dirname, "src/shared/api"),
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
    projects: [
      {
        extends: true,
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
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
