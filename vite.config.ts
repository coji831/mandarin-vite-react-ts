import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
      utils: path.resolve(__dirname, "src/utils"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001", // <--- Point to your new Express server port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
