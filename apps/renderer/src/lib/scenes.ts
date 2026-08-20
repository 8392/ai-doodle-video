import type { Scene, VideoProject } from "@ai-doodle/video-schema";
import {
  incomingTransitionProgress,
  resolveSceneTransition,
} from "../transitions/scene-transition";

export function sceneEndFrame(scene: Scene): number {
  return scene.startFrame + scene.durationInFrames;
}

export function findSceneIndexAtFrame(
  project: VideoProject,
  frame: number,
): number {
  const index = project.scenes.findIndex(
    (scene) => frame >= scene.startFrame && frame < sceneEndFrame(scene),
  );
  if (index >= 0) {
    return index;
  }
  return Math.max(0, project.scenes.length - 1);
}

export function visibleScenes(project: VideoProject, frame: number): Scene[] {
  const index = findSceneIndexAtFrame(project, frame);
  const current = project.scenes[index];
  if (!current) {
    return [];
  }

  const localFrame = frame - current.startFrame;
  const transition = resolveSceneTransition(project, current);
  const progress = incomingTransitionProgress(
    index,
    localFrame,
    transition,
    current.durationInFrames,
  );
  const previous = index > 0 ? project.scenes[index - 1] : undefined;

  if (previous && progress < 1) {
    return [previous, current];
  }

  return [current];
}
