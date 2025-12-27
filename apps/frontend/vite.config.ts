import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  publicDir: path.resolve(__dirname, "public"),
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
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
});
