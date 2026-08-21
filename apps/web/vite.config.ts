import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { remotionRenderPlugin } from "./vite-plugin-render";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

export default defineConfig({
  plugins: [react(), remotionRenderPlugin(repoRoot)],
  publicDir: path.join(repoRoot, "public"),
  resolve: {
    dedupe: ["react", "react-dom", "remotion"],
    alias: {
      "@ai-doodle/ai": path.join(repoRoot, "packages/ai/src/index.ts"),
      "@ai-doodle/video-schema": path.join(repoRoot, "packages/video-schema/src/index.ts"),
      "@ai-doodle/animation-engine": path.join(repoRoot, "packages/animation-engine/src/index.ts"),
      "@ai-doodle/asset-library": path.join(repoRoot, "packages/asset-library/src/index.ts"),
      "@ai-doodle/renderer": path.join(repoRoot, "apps/renderer/src/exports.ts"),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "remotion",
      "@remotion/player",
      "@remotion/web-renderer",
      "@remotion/media",
      "mediabunny",
    ],
    exclude: [
      "@ai-doodle/ai",
      "@ai-doodle/renderer",
      "@ai-doodle/video-schema",
      "@ai-doodle/animation-engine",
      "@ai-doodle/asset-library",
    ],
  },
});
