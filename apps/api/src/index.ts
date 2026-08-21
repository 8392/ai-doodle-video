import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ensureMusicBeds } from "./ensure-music";
import { llmConfigured } from "./llm";
import { azureTtsConfigured } from "./azure-tts";
import { createAuthRouter } from "./routes/auth";
import { createGenerateRouter } from "./routes/generate";
import { createProjectsRouter, createShareRouter } from "./routes/projects";
import { createRenderRouter } from "./routes/render";
import { createTtsRouter, resolveRepoRoot } from "./routes/tts";
import { createUploadsRouter } from "./routes/uploads";
import { createStore } from "./store";
import { MUSIC_TRACKS } from "@ai-doodle/ai";

const PORT = Number(process.env.PORT ?? 8787);
const repoRoot = resolveRepoRoot(fileURLToPath(new URL(".", import.meta.url)));
const store = createStore(repoRoot);
ensureMusicBeds(repoRoot);

const app = new Hono();
app.use(
  "*",
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    llm: llmConfigured(),
    azureTts: azureTtsConfigured(),
  }),
);
app.get("/api/status", (c) =>
  c.json({
    llm: llmConfigured(),
    azureTts: azureTtsConfigured(),
    music: MUSIC_TRACKS,
  }),
);

app.route("/api/tts", createTtsRouter(repoRoot));
app.route("/api/generate", createGenerateRouter());
app.route("/api/auth", createAuthRouter(store));
app.route("/api/projects", createProjectsRouter(store));
app.route("/api/shares", createShareRouter(store));
app.route("/api/uploads", createUploadsRouter(repoRoot));
app.route("/api/render", createRenderRouter(repoRoot));

app.get("/api/output/:file", (c) => {
  const name = c.req.param("file").replace(/[^a-zA-Z0-9._-]/g, "");
  const filePath = resolve(repoRoot, "output", name);
  try {
    const data = readFileSync(filePath);
    const ext = extname(name).toLowerCase();
    const type = ext === ".mp4" ? "video/mp4" : "application/octet-stream";
    return new Response(Uint8Array.from(data), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch {
    return c.json({ error: "文件不存在" }, 404);
  }
});

console.log(`[api] listening on http://127.0.0.1:${PORT}`);
console.log(`[api] repoRoot=${repoRoot}`);
console.log(`[api] llm=${llmConfigured()} azureTts=${azureTtsConfigured()}`);

serve({
  fetch: app.fetch,
  port: PORT,
  hostname: "127.0.0.1",
});
