import type { Scene, VideoProject } from "@ai-doodle/video-schema";

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
  return project.scenes.filter((scene) => frame >= scene.startFrame);
}
