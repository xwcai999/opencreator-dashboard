import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const localApiTarget = process.env.OPENCREATOR_LOCAL_API_TARGET || "http://127.0.0.1:17620";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4173,
    proxy: {
      "/local-api": {
        target: localApiTarget,
        changeOrigin: true,
        headers: { origin: localApiTarget },
        rewrite: (path) => path.replace(/^\/local-api/, "")
      }
    }
  },
  preview: { host: "127.0.0.1", port: 4173 },
  build: { outDir: "dist", sourcemap: true }
});
