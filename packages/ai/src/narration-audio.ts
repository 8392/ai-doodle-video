import { retimeProject, type VideoProject } from "@ai-doodle/video-schema";
import { expandCaptionsBySentence } from "@ai-doodle/video-schema";

export type NarrationAudioInput = {
  src: string;
  durationInFrames: number;
  volume?: number;
};

export type SceneAudioClip = NarrationAudioInput & {
  sceneId: string;
};

/**
 * Attach a synthesized narration track and stretch scene lengths so the
 * timeline matches the spoken audio (by character weight and real duration).
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
    const camera = scene.camera
      ? { ...scene.camera, durationInFrames: frames }
      : scene.camera;
    return { ...scene, durationInFrames: frames, camera };
  });

  const timed = retimeProject({ ...project, scenes });
  const withAudio: VideoProject = {
    ...timed,
    narration: {
      src: audio.src,
      startFrame: 0,
      durationInFrames: Math.max(timed.durationInFrames, durationInFrames),
      volume: audio.volume ?? 0.85,
    },
    music: timed.music
      ? { ...timed.music, durationInFrames: timed.durationInFrames }
      : undefined,
  };
  return expandCaptionsBySentence(withAudio);
}

export function applySceneAudioClips(
  project: VideoProject,
  clips: SceneAudioClip[],
): VideoProject {
  const byId = new Map(clips.map((clip) => [clip.sceneId, clip]));
  const pad = Math.max(1, Math.round(project.fps * 0.25));
  const scenes = project.scenes.map((scene) => {
    const clip = byId.get(scene.id);
    if (!clip) {
      return scene;
    }
    const durationInFrames = Math.max(
      Math.round(project.fps * 1.5),
      clip.durationInFrames + pad,
    );
    return {
      ...scene,
      durationInFrames,
      camera: scene.camera
        ? { ...scene.camera, durationInFrames }
        : scene.camera,
      audio: {
        src: clip.src,
        startFrame: 0,
        durationInFrames: clip.durationInFrames,
        volume: clip.volume ?? 0.85,
      },
    };
  });
  const timed = retimeProject({ ...project, scenes });
  const aligned = {
    ...timed,
    scenes: timed.scenes.map((scene) =>
      scene.audio
        ? {
            ...scene,
            audio: { ...scene.audio, startFrame: scene.startFrame },
          }
        : scene,
    ),
    music: timed.music
      ? { ...timed.music, durationInFrames: timed.durationInFrames }
      : undefined,
  };
  const { narration: _removed, ...rest } = aligned;
  return expandCaptionsBySentence(rest);
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
