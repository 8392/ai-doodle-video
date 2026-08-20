import { parseVideoProject, retimeProject, type VideoProject } from "@ai-doodle/video-schema";
import { layoutElements } from "./layout";
import { matchAssetsForNarration } from "./match-assets";
import { EmptyScriptError, splitScript } from "./split-script";

export type GenerateInput = {
  script: string;
  language: string;
  voice: string;
  aspect: "9:16" | "16:9" | "1:1";
  style: string;
};

export { EmptyScriptError };

export function generateVideoProject(input: GenerateInput): VideoProject {
  const narrations = splitScript(input.script);
  const { width, height } = sizeForAspect(input.aspect);
  const fps = 30;
  const sceneDuration = Math.max(1, fps * 3);
  const id = `proj-${shortId()}`;

  const usedAssetIds: string[] = [];
  const scenes = narrations.map((narration, index) => {
    const assets = matchAssetsForNarration(narration, usedAssetIds);
    usedAssetIds.push(...assets.map((asset) => asset.id));
    return {
      id: `scene-${index + 1}-${shortId()}`,
      startFrame: 0,
      durationInFrames: sceneDuration,
      narration,
      camera: { x: 0, y: 0, scale: 1, durationInFrames: 1 },
      elements: layoutElements(assets, { width, height }, `el-${index + 1}`),
    };
  });

  const draft: VideoProject = {
    id,
    name: projectName(input.script),
    width,
    height,
    fps,
    durationInFrames: 1,
    background: { type: "paper", color: "#E7E7E7" },
    language: input.language.trim() || "zh",
    defaultTransition: {
      type: "fade",
      durationInFrames: 18,
      easing: "ease-in-out",
    },
    scenes,
  };

  const timed = retimeProject(draft);
  const project: VideoProject = {
    ...timed,
    narration: {
      src: "/audio/demo.wav",
      startFrame: 0,
      durationInFrames: timed.durationInFrames,
      volume: 0.7,
    },
  };

  void input.voice;
  void input.style;

  return parseVideoProject(project);
}

function sizeForAspect(aspect: GenerateInput["aspect"]): {
  width: number;
  height: number;
} {
  if (aspect === "16:9") {
    return { width: 1920, height: 1080 };
  }
  if (aspect === "1:1") {
    return { width: 1080, height: 1080 };
  }
  return { width: 1080, height: 1920 };
}

function projectName(script: string): string {
  const first =
    script
      .trim()
      .split(/[。！？!?；;\n]+/)
      .map((part) => part.trim())
      .find((part) => part.length > 0) ?? "未命名视频";
  return first.length > 24 ? `${first.slice(0, 24)}…` : first;
}

function shortId(): string {
  return crypto.randomUUID().slice(0, 8);
}
