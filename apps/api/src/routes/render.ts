import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { Hono } from "hono";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";

type Job = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  error?: string;
  output?: string;
};

export function createRenderRouter(repoRoot: string): Hono {
  const jobs = new Map<string, Job>();
  const router = new Hono();

  router.post("/", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { project?: unknown };
    let project: VideoProject;
    try {
      project = parseVideoProject(body.project);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "项目无效" },
        400,
      );
    }
    const id = `job-${crypto.randomUUID().slice(0, 8)}`;
    const job: Job = { id, status: "queued" };
    jobs.set(id, job);
    runRender(repoRoot, project, job);
    return c.json({ jobId: id, status: job.status });
  });

  router.get("/:jobId", (c) => {
    const job = jobs.get(c.req.param("jobId"));
    if (!job) {
      return c.json({ error: "任务不存在" }, 404);
    }
    return c.json(job);
  });

  return router;
}

function runRender(repoRoot: string, project: VideoProject, job: Job): void {
  job.status = "running";
  const jsonDir = resolve(repoRoot, "data/render-jobs");
  mkdirSync(jsonDir, { recursive: true });
  const jsonPath = resolve(jsonDir, `${project.id}.json`);
  writeFileSync(jsonPath, JSON.stringify(project, null, 2));
  const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const child = spawn(
    pnpmBin,
    ["--filter", "@ai-doodle/renderer", "render:json", "--", jsonPath],
    {
      cwd: repoRoot,
      shell: true,
      windowsHide: true,
    },
  );
  child.on("error", (error) => {
    job.status = "error";
    job.error = error.message;
  });
  child.on("close", (code) => {
    if (code === 0) {
      job.status = "done";
      job.output = `/output/${project.id}.mp4`;
      return;
    }
    job.status = "error";
    job.error = `渲染进程退出码 ${code ?? "unknown"}`;
  });
}
