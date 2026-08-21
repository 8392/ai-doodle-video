import {
  applyNarrationAudio,
  buildNarrationScript,
  type NarrationAudioInput,
} from "@ai-doodle/ai";
import type { VideoProject } from "@ai-doodle/video-schema";

export type TtsOptions = {
  voice: string;
  language: string;
  fileId?: string;
};

export type TtsResult = NarrationAudioInput & {
  durationSec: number;
  voice: string;
};

export async function requestTts(
  text: string,
  options: TtsOptions & { fps: number },
): Promise<TtsResult> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice: options.voice,
      language: options.language,
      fileId: options.fileId,
      fps: options.fps,
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    src?: string;
    durationInFrames?: number;
    durationSec?: number;
    voice?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "语音合成失败");
  }
  if (
    typeof payload.src !== "string" ||
    typeof payload.durationInFrames !== "number"
  ) {
    throw new Error("语音合成返回无效");
  }

  return {
    src: payload.src,
    durationInFrames: payload.durationInFrames,
    durationSec: payload.durationSec ?? payload.durationInFrames / options.fps,
    voice: payload.voice ?? options.voice,
    volume: 0.85,
  };
}

export async function attachTtsNarration(
  project: VideoProject,
  options: TtsOptions,
): Promise<VideoProject> {
  const text = buildNarrationScript(project);
  if (!text) {
    throw new Error("没有可合成的旁白文案");
  }
  const audio = await requestTts(text, {
    ...options,
    fileId: options.fileId ?? `${project.id}-narration`,
    fps: project.fps,
  });
  return applyNarrationAudio(project, audio);
}
