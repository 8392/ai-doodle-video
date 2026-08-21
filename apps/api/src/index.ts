import { serve } from "@hono/node-server";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createTtsRouter, resolveRepoRoot } from "./routes/tts";

const PORT = Number(process.env.PORT ?? 8787);
const repoRoot = resolveRepoRoot(fileURLToPath(new URL(".", import.meta.url)));

const app = new Hono();
app.use(
  "*",
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/tts", createTtsRouter(repoRoot));

console.log(`[api] listening on http://127.0.0.1:${PORT}`);
console.log(`[api] repoRoot=${repoRoot}`);

serve({
  fetch: app.fetch,
  port: PORT,
  hostname: "127.0.0.1",
});
