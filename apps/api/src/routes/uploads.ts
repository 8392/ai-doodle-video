import { mkdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Hono } from "hono";

const ALLOWED = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export function createUploadsRouter(repoRoot: string): Hono {
  const router = new Hono();

  router.post("/", async (c) => {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      return c.json({ error: "请选择图片或 SVG 文件" }, 400);
    }
    const ext = extname(file.name || "").toLowerCase() || ".png";
    if (!ALLOWED.has(ext)) {
      return c.json({ error: "仅支持 SVG / PNG / JPG / WebP" }, 400);
    }
    const id = `up-${crypto.randomUUID().slice(0, 10)}`;
    const relative = `/uploads/${id}${ext}`;
    const outPath = resolve(repoRoot, "public", relative.slice(1));
    mkdirSync(resolve(repoRoot, "public/uploads"), { recursive: true });
    writeFileSync(outPath, Buffer.from(await file.arrayBuffer()));
    return c.json({ src: relative, name: file.name, id });
  });

  return router;
}
