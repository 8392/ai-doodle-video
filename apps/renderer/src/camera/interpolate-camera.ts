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

export function interpolateCamera(
  project: VideoProject,
  sceneIndex: number,
  localFrame: number,
): ResolvedCamera {
  const scene = project.scenes[sceneIndex];
  if (!scene) {
    return { x: 0, y: 0, scale: 1 };
  }
  const previous = sceneIndex > 0 ? project.scenes[sceneIndex - 1] : undefined;
  const from = previous?.camera ?? DEFAULT_CAMERA;
  const to = scene.camera ?? DEFAULT_CAMERA;
  const duration = Math.max(1, to.durationInFrames);
  const t = applyEasing(localFrame / duration, to.easing);

  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    scale: lerp(from.scale, to.scale, t),
  };
}
