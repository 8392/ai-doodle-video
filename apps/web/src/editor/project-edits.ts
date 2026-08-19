import type { AssetDefinition } from "@ai-doodle/asset-library";
import type { Element, Scene, VideoProject } from "@ai-doodle/video-schema";

function replaceScene(
  project: VideoProject,
  sceneId: string,
  updater: (scene: Scene) => Scene,
): VideoProject {
  return {
    ...project,
    scenes: project.scenes.map((scene) =>
      scene.id === sceneId ? updater(scene) : scene,
    ),
  };
}

export function findScene(
  project: VideoProject,
  sceneId: string | null,
): Scene | undefined {
  if (!sceneId) {
    return project.scenes[0];
  }
  return project.scenes.find((scene) => scene.id === sceneId) ?? project.scenes[0];
}

export function findElement(
  project: VideoProject,
  elementId: string | null,
): Element | undefined {
  if (!elementId) {
    return undefined;
  }
  for (const scene of project.scenes) {
    const match = scene.elements.find((element) => element.id === elementId);
    if (match) {
      return match;
    }
  }
  return undefined;
}

export function setProjectName(project: VideoProject, name: string): VideoProject {
  return { ...project, name };
}

export function addAssetToScene(
  project: VideoProject,
  sceneId: string,
  asset: AssetDefinition,
): { project: VideoProject; elementId: string } {
  const elementId = `el-${asset.id}-${crypto.randomUUID().slice(0, 8)}`;
  const width = Math.round(project.width * 0.42);
  const height = Math.round(width * 0.82);
  const element: Element = {
    id: elementId,
    type: asset.type === "svg" ? "svg" : "image",
    assetId: asset.id,
    x: Math.round(project.width * 0.29),
    y: Math.round(project.height * 0.28),
    width,
    height,
    zIndex: 2,
    animation:
      asset.type === "svg"
        ? { type: "draw", durationInFrames: 48, easing: "linear" }
        : { type: "fade", durationInFrames: 18 },
  };

  return {
    elementId,
    project: replaceScene(project, sceneId, (scene) => ({
      ...scene,
      elements: [...scene.elements, element],
    })),
  };
}

export function updateElement(
  project: VideoProject,
  elementId: string,
  patch: Partial<Pick<Element, "x" | "y" | "scale" | "rotation" | "opacity" | "width" | "height">>,
): VideoProject {
  return {
    ...project,
    scenes: project.scenes.map((scene) => ({
      ...scene,
      elements: scene.elements.map((element) =>
        element.id === elementId ? { ...element, ...patch } : element,
      ),
    })),
  };
}

export function applyAspectRatio(
  project: VideoProject,
  ratio: "9:16" | "16:9" | "1:1",
): VideoProject {
  const size =
    ratio === "16:9"
      ? { width: 1920, height: 1080 }
      : ratio === "1:1"
        ? { width: 1080, height: 1080 }
        : { width: 1080, height: 1920 };
  return { ...project, ...size };
}
