import { assets, getAsset } from "@ai-doodle/asset-library";
import {
  parseVideoProject,
  retimeProject,
  type SceneLayout,
  type VideoProject,
} from "@ai-doodle/video-schema";
import { z } from "zod";
import { inferLayout, layoutElements } from "./layout";
import { matchAssetsForNarration, resolveAssetsByIds } from "./match-assets";
import {
  applyProjectStyle,
  defaultDrawingForStyle,
  resolveProjectStyle,
} from "./styles";
import { inferTheme, shortlistAssetsForTheme } from "./themes";

export const scenePlanSchema = z.object({
  narration: z.string().min(1),
  assetIds: z.array(z.string().min(1)).max(3).default([]),
  layout: z
    .enum(["focus", "compare", "flow", "map", "define", "cause"])
    .optional(),
  cameraScale: z.number().min(0.85).max(1.35).optional(),
});

export const storyboardPlanSchema = z.object({
  name: z.string().min(1).optional(),
  scenes: z.array(scenePlanSchema).min(1).max(24),
});

export type ScenePlan = z.infer<typeof scenePlanSchema>;
export type StoryboardPlan = z.infer<typeof storyboardPlanSchema>;

export type AssembleInput = {
  script: string;
  language: string;
  voice: string;
  aspect: "9:16" | "16:9" | "1:1";
  style: string;
  projectId?: string;
};

export function sizeForAspect(aspect: AssembleInput["aspect"]): {
  width: number;
  height: number;
} {
  if (aspect === "16:9") {
    return { width: 1920, height: 1080 };
  }
  if (aspect === "1:1") {
    return { width: 1080, height: 1080 };
  }
  return { width: 1080, height: 1920 };
}

export function projectNameFromScript(script: string): string {
  const first =
    script
      .trim()
      .split(/[。！？!?；;\n]+/)
      .map((part) => part.trim())
      .find((part) => part.length > 0) ?? "未命名视频";
  return first.length > 24 ? `${first.slice(0, 24)}…` : first;
}

export function shortId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("模型没有返回可用的 JSON 分镜");
  }
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

export function parseStoryboardPlan(input: unknown): StoryboardPlan {
  return storyboardPlanSchema.parse(input);
}

export function catalogForPrompt(script?: string, limit = 120): string {
  const theme = inferTheme(script ?? "");
  const pool = shortlistAssetsForTheme(assets, theme, limit);
  return pool
    .map((asset) => {
      const aliases = (asset.aliases ?? []).slice(0, 2).join(",");
      const tags = asset.tags.slice(0, 3).join(",");
      return `${asset.id}|${asset.name}|${tags}${aliases ? `|${aliases}` : ""}`;
    })
    .join("\n");
}

export function assembleVideoProject(
  plan: StoryboardPlan,
  input: AssembleInput,
): VideoProject {
  const { width, height } = sizeForAspect(input.aspect);
  const fps = 30;
  const sceneDuration = Math.max(1, fps * 3);
  const id = input.projectId ?? `proj-${shortId()}`;
  const usedAssetIds: string[] = [];
  const style = resolveProjectStyle(input.style);
  const drawing = defaultDrawingForStyle(style);

  const scenes = plan.scenes.map((scenePlan, index) => {
    const assetsForScene = pickSceneAssets(scenePlan, usedAssetIds, input.script);
    usedAssetIds.push(...assetsForScene.map((asset) => asset.id));
    const layout = (scenePlan.layout ??
      inferLayout(scenePlan.narration, assetsForScene.length)) as SceneLayout;
    const scale =
      scenePlan.cameraScale ??
      (layout === "focus" || layout === "define" ? 1.1 : 1.06);
    return {
      id: `scene-${index + 1}-${shortId()}`,
      startFrame: 0,
      durationInFrames: sceneDuration,
      narration: scenePlan.narration.trim(),
      layout,
      camera: {
        x: layout === "map" ? 16 : 0,
        y: layout === "focus" || layout === "define" ? -24 : 0,
        scale,
        durationInFrames: sceneDuration,
        easing: "ease-in-out",
      },
      elements: layoutElements(
        assetsForScene,
        { width, height },
        `el-${index + 1}`,
        layout,
        {
          narration: scenePlan.narration,
          defaultAnimation: drawing.defaultAnimation,
        },
      ),
    };
  });

  const draft: VideoProject = {
    id,
    name: plan.name?.trim() || projectNameFromScript(input.script),
    width,
    height,
    fps,
    durationInFrames: 1,
    background: { type: "paper", color: "#E7E7E7" },
    language: input.language.trim() || "zh",
    voice: input.voice,
    style,
    drawing,
    defaultTransition: {
      type: "fade",
      durationInFrames: 18,
      easing: "ease-in-out",
    },
    scenes,
  };

  return parseVideoProject(applyProjectStyle(retimeProject(draft), input.style));
}

function pickSceneAssets(
  scenePlan: ScenePlan,
  usedAssetIds: string[],
  scriptContext: string,
) {
  const fromPlan = resolveAssetsByIds(scenePlan.assetIds);
  if (fromPlan.length > 0) {
    return fromPlan;
  }
  return matchAssetsForNarration(scenePlan.narration, usedAssetIds, {
    scriptContext,
  });
}

export function buildStoryboardSystemPrompt(script?: string): string {
  return [
    "You are a whiteboard explainer storyboard director.",
    "Return ONLY JSON with shape { name?: string, scenes: [{ narration, assetIds, layout?, cameraScale? }] }.",
    "Rules:",
    "- 3 to 12 scenes unless the script is extremely short.",
    "- narration is the spoken line for that scene, in the same language as the script.",
    "- assetIds MUST be chosen from the catalog ids below, 1 to 3 per scene, no hands.",
    "- layout is one of focus | compare | flow | map | define | cause.",
    "- Prefer concrete icons that match the sentence. Never use globe or newspaper unless the sentence is about the world or media.",
    "- Use define for definition scenes, cause for cause-effect scenes.",
    "- cameraScale between 1.0 and 1.18.",
    "",
    "Catalog (id|name|tags|aliases):",
    catalogForPrompt(script),
  ].join("\n");
}

export function getAssetName(id: string): string | undefined {
  return getAsset(id)?.name;
}
