import { Hono } from "hono";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";
import { generateWithLlm, regenerateSceneWithLlm } from "../llm";
import type { GenerateInput } from "@ai-doodle/ai";

export function createGenerateRouter(): Hono {
  const router = new Hono();

  router.post("/", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Partial<GenerateInput>;
    const script = typeof body.script === "string" ? body.script : "";
    if (!script.trim()) {
      return c.json({ error: "请先输入文案" }, 400);
    }
    const input: GenerateInput = {
      script,
      language: typeof body.language === "string" ? body.language : "zh",
      voice: typeof body.voice === "string" ? body.voice : "zh-CN-XiaoxiaoNeural",
      aspect:
        body.aspect === "16:9" || body.aspect === "1:1" || body.aspect === "9:16"
          ? body.aspect
          : "9:16",
      style: typeof body.style === "string" ? body.style : "whiteboard",
    };
    const result = await generateWithLlm(input);
    return c.json(result);
  });

  router.post("/scene", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      project?: unknown;
      sceneId?: unknown;
      narration?: unknown;
    };
    let project: VideoProject;
    try {
      project = parseVideoProject(body.project);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "项目无效" },
        400,
      );
    }
    const sceneId = typeof body.sceneId === "string" ? body.sceneId : "";
    if (!sceneId) {
      return c.json({ error: "缺少 sceneId" }, 400);
    }
    const narration = typeof body.narration === "string" ? body.narration : undefined;
    const next = await regenerateSceneWithLlm(project, sceneId, narration);
    return c.json({ project: next });
  });

  return router;
}
