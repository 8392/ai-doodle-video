import { spawn } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function pathnameOf(req: IncomingMessage): string {
  const url = req.url ?? "/";
  const query = url.indexOf("?");
  return query >= 0 ? url.slice(0, query) : url;
}

export function remotionRenderPlugin(repoRoot: string): Plugin {
  let rendering = false;

  return {
    name: "ai-doodle-render-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || pathnameOf(req) !== "/api/render") {
          next();
          return;
        }

        void (async () => {
          req.socket.setTimeout(0);
          res.setTimeout(0);

          if (rendering) {
            sendJson(res, 409, { error: "已有渲染任务在进行，请稍后再试" });
            return;
          }

          rendering = true;
          try {
            const raw = JSON.parse(await readBody(req)) as {
              id?: unknown;
              scenes?: unknown;
            };
            if (typeof raw.id !== "string" || !Array.isArray(raw.scenes)) {
              sendJson(res, 400, { error: "Invalid VideoProject JSON" });
              return;
            }

            const outputDir = resolve(repoRoot, "output");
            mkdirSync(outputDir, { recursive: true });
            const jsonPath = resolve(outputDir, `${raw.id}.json`);
            writeFileSync(jsonPath, JSON.stringify(raw));

            await new Promise<void>((resolveRender, rejectRender) => {
              const child = spawn(
                process.platform === "win32" ? "pnpm.cmd" : "pnpm",
                ["render:json", jsonPath],
                { cwd: repoRoot, env: process.env },
              );
              child.stdout?.on("data", (chunk: Buffer) => {
                server.config.logger.info(chunk.toString());
              });
              child.stderr?.on("data", (chunk: Buffer) => {
                server.config.logger.info(chunk.toString());
              });
              child.on("error", rejectRender);
              child.on("close", (code) => {
                if (code === 0) {
                  resolveRender();
                  return;
                }
                rejectRender(new Error(`render:json exited with code ${code}`));
              });
            });

            const mp4Path = resolve(outputDir, `${raw.id}.mp4`);
            if (!existsSync(mp4Path)) {
              sendJson(res, 500, { error: "渲染结束但没有生成 MP4" });
              return;
            }

            const { size } = statSync(mp4Path);
            res.statusCode = 200;
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Content-Length", String(size));
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${raw.id}.mp4"`,
            );
            createReadStream(mp4Path).pipe(res);
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "渲染失败",
            });
          } finally {
            rendering = false;
          }
        })();
      });
    },
  };
}
