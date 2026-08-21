import { retimeProject, type VideoProject } from "@ai-doodle/video-schema";

export type NarrationAudioInput = {
  src: string;
  durationInFrames: number;
  volume?: number;
};

/**
 * Attach a synthesized narration track and stretch scene lengths so the
 * timeline roughly matches the spoken audio (by character weight).
 */
export function applyNarrationAudio(
  project: VideoProject,
  audio: NarrationAudioInput,
): VideoProject {
  const durationInFrames = Math.max(1, Math.floor(audio.durationInFrames));
  const weights = project.scenes.map((scene) =>
    Math.max(characterWeight(scene.narration), 4),
  );
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const minFrames = Math.max(1, Math.round(project.fps * 1.5));

  let allocated = 0;
  const scenes = project.scenes.map((scene, index) => {
    const isLast = index === project.scenes.length - 1;
    const share = weights[index] ?? 4;
    let frames = isLast
      ? Math.max(minFrames, durationInFrames - allocated)
      : Math.max(
          minFrames,
          Math.round((durationInFrames * share) / totalWeight),
        );
    if (!isLast && allocated + frames > durationInFrames - minFrames) {
      frames = Math.max(minFrames, durationInFrames - allocated - minFrames);
    }
    allocated += frames;
    return { ...scene, durationInFrames: frames };
  });

  const timed = retimeProject({ ...project, scenes });
  return {
    ...timed,
    narration: {
      src: audio.src,
      startFrame: 0,
      durationInFrames: Math.max(timed.durationInFrames, durationInFrames),
      volume: audio.volume ?? 0.85,
    },
  };
}

export function buildNarrationScript(project: VideoProject): string {
  return project.scenes
    .map((scene) => scene.narration?.trim() ?? "")
    .filter((text) => text.length > 0)
    .join("。");
}

function characterWeight(text: string | undefined): number {
  if (!text) {
    return 0;
  }
  return [...text.trim()].length;
}
