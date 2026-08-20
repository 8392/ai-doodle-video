import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseVideoProject } from "@ai-doodle/video-schema";
import { unwrapProjectJson } from "../src/lib/project-json";

function usage(): never {
  console.error("Usage: pnpm render:json <file.json>");
  process.exit(1);
}

function resolveInput(input: string, repoRoot: string): string {
  const candidates = [
    resolve(process.cwd(), input),
    process.env.INIT_CWD ? resolve(process.env.INIT_CWD, input) : "",
    resolve(repoRoot, input),
  ].filter(Boolean);
  const unique = [...new Set(candidates)];
  for (const candidate of unique) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(`Cannot find JSON file: ${input}`);
}

const input = process.argv.slice(2).find((arg) => arg && arg !== "--");
if (!input) {
  usage();
}

const rendererRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(rendererRoot, "../..");
const filePath = resolveInput(input, repoRoot);
const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
const project = parseVideoProject(unwrapProjectJson(raw));

const propsPath = resolve(rendererRoot, ".render-props.json");
writeFileSync(propsPath, JSON.stringify({ project }));

const outputDir = resolve(repoRoot, "output");
mkdirSync(outputDir, { recursive: true });
const output = resolve(outputDir, `${project.id}.mp4`);

console.log(`Rendering ${project.id} (${project.durationInFrames} frames) → ${output}`);

const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(
  pnpmBin,
  [
    "exec",
    "remotion",
    "render",
    "src/index.ts",
    "Demo",
    output,
    "--overwrite",
    `--props=${propsPath}`,
  ],
  {
    cwd: rendererRoot,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Wrote ${output}`);
