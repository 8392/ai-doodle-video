import { Hono } from "hono";
import { parseVideoProject } from "@ai-doodle/video-schema";
import { requireUser } from "./auth";
import type { ProjectStore } from "../store";

export function createProjectsRouter(store: ProjectStore): Hono {
  const router = new Hono();

  router.get("/", (c) => {
    const user = requireUser(store, c.req.header("Authorization"));
    const items = store.listProjects(user.userId).map((item) => ({
      id: item.project.id,
      name: item.project.name,
      updatedAt: item.updatedAt,
      shareId: item.shareId,
      durationInFrames: item.project.durationInFrames,
      fps: item.project.fps,
      width: item.project.width,
      height: item.project.height,
    }));
    return c.json({ projects: items });
  });

  router.get("/:id", (c) => {
    const record = store.readProject(c.req.param("id"));
    if (!record) {
      return c.json({ error: "项目不存在" }, 404);
    }
    return c.json({ project: record.project, shareId: record.shareId });
  });

  router.put("/:id", async (c) => {
    const user = requireUser(store, c.req.header("Authorization"));
    const body = (await c.req.json().catch(() => ({}))) as { project?: unknown };
    try {
      const project = parseVideoProject(body.project);
      const saved = store.saveProject(user.userId, { ...project, id: c.req.param("id") });
      return c.json({ project: saved.project, updatedAt: saved.updatedAt });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "项目无效" },
        400,
      );
    }
  });

  router.delete("/:id", (c) => {
    const user = requireUser(store, c.req.header("Authorization"));
    const ok = store.deleteProject(c.req.param("id"), user.userId);
    return c.json({ ok });
  });

  router.post("/:id/share", (c) => {
    const user = requireUser(store, c.req.header("Authorization"));
    const shareId = store.shareProject(c.req.param("id"), user.userId);
    if (!shareId) {
      return c.json({ error: "无法分享该项目" }, 404);
    }
    return c.json({ shareId, url: `/share/${shareId}` });
  });

  return router;
}

export function createShareRouter(store: ProjectStore): Hono {
  const router = new Hono();
  router.get("/:shareId", (c) => {
    const project = store.readShared(c.req.param("shareId"));
    if (!project) {
      return c.json({ error: "分享不存在或已失效" }, 404);
    }
    return c.json({ project });
  });
  return router;
}
