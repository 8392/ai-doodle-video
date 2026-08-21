import {
  assembleVideoProject,
  buildStoryboardSystemPrompt,
  extractJsonObject,
  generateVideoProject,
  parseStoryboardPlan,
  regenerateScene,
  type GenerateInput,
} from "@ai-doodle/ai";
import type { VideoProject } from "@ai-doodle/video-schema";

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

export async function generateWithLlm(input: GenerateInput): Promise<{
  project: VideoProject;
  source: "llm" | "heuristic";
}> {
  if (!llmConfigured()) {
    return { project: generateVideoProject(input), source: "heuristic" };
  }
  try {
    const content = await completeChat(
      buildStoryboardSystemPrompt(input.script),
      `Language: ${input.language}\nStyle: ${input.style}\nScript:\n${input.script}`,
    );
    const plan = parseStoryboardPlan(extractJsonObject(content));
    return { project: assembleVideoProject(plan, input), source: "llm" };
  } catch (error) {
    console.warn(
      "[llm] falling back to heuristic:",
      error instanceof Error ? error.message : error,
    );
    return { project: generateVideoProject(input), source: "heuristic" };
  }
}

export async function regenerateSceneWithLlm(
  project: VideoProject,
  sceneId: string,
  narration?: string,
): Promise<VideoProject> {
  const scene = project.scenes.find((item) => item.id === sceneId);
  if (!scene) {
    return project;
  }
  const text = (narration ?? scene.narration ?? "").trim();
  if (!llmConfigured() || !text) {
    return regenerateScene(project, sceneId, text);
  }
  try {
    const content = await completeChat(
      buildStoryboardSystemPrompt(text),
      `Regenerate ONE scene as JSON { "scenes": [ { narration, assetIds, layout, cameraScale } ] }.\nKeep the spoken line close to:\n${text}`,
    );
    const plan = parseStoryboardPlan(extractJsonObject(content));
    const next = plan.scenes[0];
    if (!next) {
      return regenerateScene(project, sceneId, text);
    }
    return regenerateScene(project, sceneId, next.narration, next.assetIds);
  } catch {
    return regenerateScene(project, sceneId, text);
  }
}

async function completeChat(system: string, user: string): Promise<string> {
  const base = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const key = process.env.LLM_API_KEY;
  if (!key) {
    throw new Error("缺少 LLM_API_KEY");
  }

  const payload = {
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, response_format: { type: "json_object" } }),
  });
  if (!response.ok) {
    const fallback = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!fallback.ok) {
      throw new Error(`LLM ${fallback.status}`);
    }
    return readContent(fallback);
  }
  return readContent(response);
}

async function readContent(response: Response): Promise<string> {
  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM 返回为空");
  }
  return content;
}
