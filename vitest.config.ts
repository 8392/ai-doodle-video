import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@ai-doodle/animation-engine": path.join(
        root,
        "packages/animation-engine/src/index.ts",
      ),
      "@ai-doodle/asset-library": path.join(root, "packages/asset-library/src/index.ts"),
      "@ai-doodle/video-schema": path.join(root, "packages/video-schema/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    environment: "node",
  },
});
