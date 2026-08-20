import type { AssetDefinition } from "@ai-doodle/asset-library";
import {
  retimeProject,
  type Element,
  type Scene,
  type TransitionConfig,
  type VideoProject,
} from "@ai-doodle/video-schema";

export { retimeProject };

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

export function findSceneIndexAtFrame(
  project: VideoProject,
  frame: number,
): number {
  const index = project.scenes.findIndex(
    (scene) =>
      frame >= scene.startFrame &&
      frame < scene.startFrame + scene.durationInFrames,
  );
  return index >= 0 ? index : Math.max(0, project.scenes.length - 1);
}

export function resolveCameraAtFrame(
  project: VideoProject,
  frame: number,
): { x: number; y: number; scale: number } {
  const sceneIndex = findSceneIndexAtFrame(project, frame);
  const camera = project.scenes[sceneIndex]?.camera;
  return {
    x: camera?.x ?? 0,
    y: camera?.y ?? 0,
    scale: camera?.scale ?? 1,
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

export function flattenSceneCameras(project: VideoProject): VideoProject {
  const originX = project.width / 2;
  const originY = project.height / 2;
  return {
    ...project,
    scenes: project.scenes.map((scene) => {
      const camera = scene.camera;
      if (!camera || (camera.x === 0 && camera.y === 0 && (camera.scale ?? 1) === 1)) {
        return scene;
      }
      const scale = camera.scale || 1;
      return {
        ...scene,
        camera: { x: 0, y: 0, scale: 1, durationInFrames: 1 },
        elements: scene.elements.map((element) => ({
          ...element,
          x: Math.round((element.x - originX) * scale + originX + camera.x),
          y: Math.round((element.y - originY) * scale + originY + camera.y),
        })),
      };
    }),
  };
}

export function setDefaultTransition(
  project: VideoProject,
  transition: TransitionConfig,
): VideoProject {
  return { ...project, defaultTransition: transition };
}

export function setSceneTransition(
  project: VideoProject,
  sceneId: string,
  transition: TransitionConfig | undefined,
): VideoProject {
  return replaceScene(project, sceneId, (scene) => {
    if (!transition) {
      const { transition: _removed, ...rest } = scene;
      return rest;
    }
    return { ...scene, transition };
  });
}

function defaultElementSize(project: VideoProject): { width: number; height: number } {
  const width = Math.round(project.width * 0.42);
  return { width, height: Math.round(width * 0.82) };
}

export function addAssetToScene(
  project: VideoProject,
  sceneId: string,
  asset: AssetDefinition,
  position?: { x: number; y: number },
): { project: VideoProject; elementId: string } {
  const elementId = `el-${asset.id}-${crypto.randomUUID().slice(0, 8)}`;
  const { width, height } = defaultElementSize(project);
  const x =
    position?.x ??
    Math.round(project.width * 0.29);
  const y =
    position?.y ??
    Math.round(project.height * 0.28);

  const element: Element = {
    id: elementId,
    type: asset.type === "svg" ? "svg" : "image",
    assetId: asset.id,
    x: Math.round(x),
    y: Math.round(y),
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

export function removeElement(
  project: VideoProject,
  elementId: string,
): VideoProject {
  return {
    ...project,
    scenes: project.scenes.map((scene) => ({
      ...scene,
      elements: scene.elements.filter((element) => element.id !== elementId),
    })),
  };
}

export function addScene(
  project: VideoProject,
  afterSceneId?: string | null,
): { project: VideoProject; sceneId: string } {
  const sceneId = `scene-${crypto.randomUUID().slice(0, 8)}`;
  const insertAfter = afterSceneId
    ? project.scenes.findIndex((scene) => scene.id === afterSceneId)
    : project.scenes.length - 1;
  const index = insertAfter >= 0 ? insertAfter + 1 : project.scenes.length;
  const scene: Scene = {
    id: sceneId,
    startFrame: 0,
    durationInFrames: Math.max(1, project.fps * 3),
    narration: "新场景",
    elements: [],
    camera: { x: 0, y: 0, scale: 1, durationInFrames: 1 },
  };
  const scenes = [...project.scenes];
  scenes.splice(index, 0, scene);
  return { sceneId, project: retimeProject({ ...project, scenes }) };
}

export function removeScene(
  project: VideoProject,
  sceneId: string,
): VideoProject {
  if (project.scenes.length <= 1) {
    return project;
  }
  return retimeProject({
    ...project,
    scenes: project.scenes.filter((scene) => scene.id !== sceneId),
  });
}

export function moveScene(
  project: VideoProject,
  sceneId: string,
  direction: -1 | 1,
): VideoProject {
  const index = project.scenes.findIndex((scene) => scene.id === sceneId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= project.scenes.length) {
    return project;
  }
  const scenes = [...project.scenes];
  const [scene] = scenes.splice(index, 1);
  if (!scene) {
    return project;
  }
  scenes.splice(nextIndex, 0, scene);
  return retimeProject({ ...project, scenes });
}

export function updateScene(
  project: VideoProject,
  sceneId: string,
  patch: Partial<Pick<Scene, "durationInFrames" | "narration">>,
): VideoProject {
  return retimeProject(
    replaceScene(project, sceneId, (scene) => ({
      ...scene,
      ...patch,
      durationInFrames: Math.max(1, patch.durationInFrames ?? scene.durationInFrames),
    })),
  );
}

export function moveElementInScene(
  project: VideoProject,
  sceneId: string,
  elementId: string,
  direction: -1 | 1,
): VideoProject {
  return replaceScene(project, sceneId, (scene) => {
    const index = scene.elements.findIndex((element) => element.id === elementId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= scene.elements.length) {
      return scene;
    }
    const elements = [...scene.elements];
    const [element] = elements.splice(index, 1);
    if (!element) {
      return scene;
    }
    elements.splice(nextIndex, 0, element);
    return { ...scene, elements };
  });
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
