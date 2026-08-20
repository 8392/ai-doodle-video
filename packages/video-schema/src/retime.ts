import type { VideoProject } from "./project";

export function retimeProject(project: VideoProject): VideoProject {
  let startFrame = 0;
  const scenes = project.scenes.map((scene) => {
    const next = { ...scene, startFrame };
    startFrame += Math.max(1, scene.durationInFrames);
    return next;
  });
  const captionsBySceneId = new Map(
    project.scenes.map((scene, index) => [scene.id, project.captions?.[index]]),
  );
  const durationInFrames = Math.max(1, startFrame);
  const captions = scenes.map((scene, index) => {
    const previous = captionsBySceneId.get(scene.id);
    const narration = scene.narration?.trim();
    return {
      text: narration || previous?.text?.trim() || `Scene ${index + 1}`,
      startFrame: scene.startFrame,
      endFrame: scene.startFrame + scene.durationInFrames,
      style: previous?.style,
    };
  });
  return {
    ...project,
    scenes,
    durationInFrames,
    captions,
  };
}
