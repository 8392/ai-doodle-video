import {
  applyNarrationAudio,
  buildNarrationScript,
  type NarrationAudioInput,
} from "@ai-doodle/ai";
import type { VideoProject } from "@ai-doodle/video-schema";

export type TtsVoiceOption = {
  id: string;
  label: string;
  language: string;
  locale?: string;
  gender: "female" | "male";
  default?: boolean;
};

export type TtsOptions = {
  /** Neural voice id, e.g. zh-CN-XiaoxiaoNeural. Also accepts legacy male|female. */
  voice: string;
  language: string;
  fileId?: string;
};

export type TtsResult = NarrationAudioInput & {
  durationSec: number;
  voice: string;
};

export async function fetchTtsVoices(
  language: string = "all",
): Promise<TtsVoiceOption[]> {
  const params = new URLSearchParams({ language });
  const response = await fetch(`/api/tts/voices?${params}`);
  const payload = (await response.json()) as {
    error?: string;
    voices?: TtsVoiceOption[];
  };
  if (!response.ok) {
    throw new Error(payload.error || "获取音色列表失败");
  }
  if (!Array.isArray(payload.voices)) {
    throw new Error("音色列表返回无效");
  }
  return payload.voices;
}

export function pickDefaultVoiceId(
  voices: TtsVoiceOption[],
  language?: string,
): string {
  const lang = (language ?? "zh").toLowerCase().startsWith("en") ? "en" : "zh";
  const preferred =
    voices.find((voice) => voice.default && voice.language === lang) ??
    voices.find((voice) => voice.default) ??
    voices.find(
      (voice) => voice.language === lang && voice.gender === "female",
    ) ??
    voices.find((voice) => voice.language === lang) ??
    voices[0];
  return preferred?.id ?? "zh-CN-XiaoxiaoNeural";
}

/** Prefer current language family first, keep full catalog. */
export function sortVoicesForLanguage(
  voices: TtsVoiceOption[],
  language: string,
): TtsVoiceOption[] {
  const lang = language.toLowerCase().startsWith("en") ? "en" : "zh";
  return [...voices].sort((a, b) => {
    const aMatch = a.language === lang ? 0 : 1;
    const bMatch = b.language === lang ? 0 : 1;
    if (aMatch !== bMatch) {
      return aMatch - bMatch;
    }
    return a.label.localeCompare(b.label, "zh");
  });
}

export async function requestTts(
  text: string,
  options: TtsOptions & { fps: number },
): Promise<TtsResult> {
  const isLegacyGender =
    options.voice === "male" || options.voice === "female";
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voiceId: isLegacyGender ? undefined : options.voice,
      voice: isLegacyGender ? options.voice : undefined,
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
