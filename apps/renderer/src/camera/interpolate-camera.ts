import { applyEasing, lerp } from "@ai-doodle/animation-engine";
import type { Camera, VideoProject } from "@ai-doodle/video-schema";

const DEFAULT_CAMERA: Camera = {
  x: 0,
  y: 0,
  scale: 1,
  durationInFrames: 1,
};

export type ResolvedCamera = {
  x: number;
  y: number;
  scale: number;
};

export function resolveSceneCamera(
  project: VideoProject,
  sceneIndex: number,
): ResolvedCamera {
  const camera = project.scenes[sceneIndex]?.camera ?? DEFAULT_CAMERA;
  return {
    x: camera.x,
    y: camera.y,
    scale: camera.scale,
  };
}

export function interpolateCamera(
  project: VideoProject,
  sceneIndex: number,
  localFrame = 0,
): ResolvedCamera {
  const scene = project.scenes[sceneIndex];
  const target = scene?.camera ?? DEFAULT_CAMERA;
  const duration = Math.max(
    1,
    Math.min(target.durationInFrames || 1, scene?.durationInFrames ?? 1),
  );
  if (duration <= 1) {
    return resolveSceneCamera(project, sceneIndex);
  }
  const from: ResolvedCamera = { x: 0, y: 0, scale: 1 };
  const t = applyEasing(localFrame / duration, target.easing ?? "ease-in-out");
  return {
    x: lerp(from.x, target.x, t),
    y: lerp(from.y, target.y, t),
    scale: lerp(from.scale, target.scale, t),
  };
}
