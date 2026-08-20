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
  _localFrame?: number,
): ResolvedCamera {
  return resolveSceneCamera(project, sceneIndex);
}
