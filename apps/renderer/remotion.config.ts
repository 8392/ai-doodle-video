import fs from "node:fs";
import path from "node:path";
import { Config } from "@remotion/cli/config";

const repoRoot = path.resolve(process.cwd(), "../..");

const localChrome = path.join(
  process.env.LOCALAPPDATA ?? "",
  "Google/Chrome/Application/chrome.exe",
);
if (fs.existsSync(localChrome)) {
  Config.setBrowserExecutable(localChrome);
}

Config.setPublicDir(path.join(repoRoot, "public"));
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(typeof currentConfiguration.resolve?.alias === "object" &&
        !Array.isArray(currentConfiguration.resolve.alias)
          ? currentConfiguration.resolve.alias
          : {}),
        "@ai-doodle/video-schema": path.join(
          repoRoot,
          "packages/video-schema/src/index.ts",
        ),
        "@ai-doodle/animation-engine": path.join(
          repoRoot,
          "packages/animation-engine/src/index.ts",
        ),
        "@ai-doodle/asset-library": path.join(
          repoRoot,
          "packages/asset-library/src/index.ts",
        ),
      },
    },
  };
});
