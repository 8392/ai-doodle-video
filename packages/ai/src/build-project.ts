import { parseVideoProject, retimeProject, type VideoProject } from "@ai-doodle/video-schema";
import { inferLayout, layoutElements } from "./layout";
import { matchAssetsForNarration, resolveAssetsByIds } from "./match-assets";
import { applyProjectStyle, defaultDrawingForStyle, resolveProjectStyle } from "./styles";
import {
  assembleVideoProject,
  projectNameFromScript,
  shortId,
  sizeForAspect,
  type AssembleInput,
  type ScenePlan,
} from "./storyboard";
import { EmptyScriptError, splitScript } from "./split-script";
import { inferTheme } from "./themes";

export type GenerateInput = AssembleInput;

export { EmptyScriptError };

export function generateVideoProject(input: GenerateInput): VideoProject {
  const narrations = splitScript(input.script);
  const usedAssetIds: string[] = [];
  const theme = inferTheme(input.script);
  const plan = {
    name: projectNameFromScript(input.script),
    scenes: narrations.map((narration) => {
      const assetsForScene = matchAssetsForNarration(narration, usedAssetIds, {
        theme,
        scriptContext: input.script,
      });
      usedAssetIds.push(...assetsForScene.map((asset) => asset.id));
      return {
        narration,
        assetIds: assetsForScene.map((asset) => asset.id),
        layout: inferLayout(narration, assetsForScene.length),
      };
    }),
  };
  return assembleVideoProject(plan, input);
}

export function regenerateScene(
  project: VideoProject,
  sceneId: string,
  narration?: string,
  assetIds?: string[],
): VideoProject {
  const index = project.scenes.findIndex((scene) => scene.id === sceneId);
  const current = project.scenes[index];
  if (!current) {
    return project;
  }
  const text = (narration ?? current.narration ?? "").trim();
  if (!text) {
    return project;
  }
  const used = project.scenes
    .filter((scene) => scene.id !== sceneId)
    .flatMap((scene) =>
      scene.elements
        .map((element) => element.assetId)
        .filter((id): id is string => Boolean(id)),
    );
  const scriptContext = project.scenes.map((scene) => scene.narration ?? "").join("\n");
  const planned = resolveAssetsByIds(assetIds ?? []);
  const extraAssets = (project.userAssets ?? [])
    .filter((asset) => asset.type === "svg")
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: "symbols" as const,
      tags: [asset.name],
      aliases: [asset.name],
      themes: ["general" as const],
      src: asset.src,
      type: "svg" as const,
    }));
  const assetsForScene =
    planned.length > 0
      ? planned
      : matchAssetsForNarration(text, used, {
          scriptContext,
          extraAssets,
        });
  const layout = inferLayout(text, assetsForScene.length);
  const { width, height } = { width: project.width, height: project.height };
  const style = resolveProjectStyle(project.style);
  const drawing = project.drawing ?? defaultDrawingForStyle(style);
  const nextScenes = project.scenes.map((scene) => {
    if (scene.id !== sceneId) {
      return scene;
    }
    return {
      ...scene,
      narration: text,
      layout,
      camera: {
        x: layout === "map" ? 16 : 0,
        y: layout === "focus" || layout === "define" ? -24 : 0,
        scale: layout === "focus" || layout === "define" ? 1.1 : 1.06,
        durationInFrames: Math.max(1, scene.durationInFrames),
        easing: "ease-in-out",
      },
      elements: layoutElements(
        assetsForScene,
        { width, height },
        `el-${shortId()}`,
        layout,
        {
          narration: text,
          defaultAnimation: drawing.defaultAnimation,
        },
      ),
    };
  });
  return parseVideoProject(
    applyProjectStyle(retimeProject({ ...project, scenes: nextScenes }), project.style),
  );
}

export function heuristicScenePlan(narration: string): ScenePlan {
  const assetsForScene = matchAssetsForNarration(narration);
  return {
    narration,
    assetIds: assetsForScene.map((asset) => asset.id),
    layout: inferLayout(narration, assetsForScene.length),
  };
}

export { sizeForAspect };
