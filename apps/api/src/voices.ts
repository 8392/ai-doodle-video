import { MsEdgeTTS, type Voice as EdgeVoice } from "msedge-tts";

export type TtsGender = "female" | "male";

export type TtsVoice = {
  id: string;
  label: string;
  /** Locale family, e.g. zh / en / ja */
  language: string;
  locale: string;
  gender: TtsGender;
  default?: boolean;
};

export const DEFAULT_VOICE_IDS = {
  zh: "zh-CN-XiaoxiaoNeural",
  en: "en-US-AriaNeural",
} as const;

const LEGACY_GENDER_VOICE_IDS = {
  zh: {
    female: "zh-CN-XiaoxiaoNeural",
    male: "zh-CN-YunxiNeural",
  },
  en: {
    female: "en-US-AriaNeural",
    male: "en-US-GuyNeural",
  },
} as const;

const CACHE_TTL_MS = 60 * 60 * 1000;

let cache: { at: number; voices: TtsVoice[] } | null = null;

export function normalizeLanguage(value: string | undefined): string {
  if (!value || value === "all") {
    return "all";
  }
  const lower = value.toLowerCase();
  if (lower.startsWith("en")) {
    return "en";
  }
  if (lower.startsWith("zh")) {
    return "zh";
  }
  return lower.slice(0, 2);
}

export function languageFamily(locale: string): string {
  return locale.toLowerCase().slice(0, 2);
}

export function mapEdgeVoice(voice: EdgeVoice): TtsVoice {
  const gender: TtsGender =
    voice.Gender.toLowerCase() === "male" ? "male" : "female";
  const language = languageFamily(voice.Locale);
  const name =
    voice.ShortName.split("-").at(-1)?.replace(/Neural$/i, "") ??
    voice.ShortName;
  const genderLabel = gender === "female" ? "女" : "男";
  const isDefault =
    voice.ShortName === DEFAULT_VOICE_IDS.zh ||
    voice.ShortName === DEFAULT_VOICE_IDS.en;

  return {
    id: voice.ShortName,
    label: `${name} · ${voice.Locale} · ${genderLabel}`,
    language,
    locale: voice.Locale,
    gender,
    ...(isDefault ? { default: true as const } : {}),
  };
}

export function filterVoices(
  voices: TtsVoice[],
  language?: string,
): TtsVoice[] {
  const lang = normalizeLanguage(language);
  const filtered =
    lang === "all"
      ? [...voices]
      : voices.filter((voice) => voice.language === lang);

  return filtered.sort((a, b) => {
    if (Boolean(a.default) !== Boolean(b.default)) {
      return a.default ? -1 : 1;
    }
    const localeCmp = a.locale.localeCompare(b.locale);
    if (localeCmp !== 0) {
      return localeCmp;
    }
    return a.label.localeCompare(b.label, "zh");
  });
}

export async function loadAllVoices(force = false): Promise<TtsVoice[]> {
  if (
    !force &&
    cache &&
    Date.now() - cache.at < CACHE_TTL_MS &&
    cache.voices.length > 0
  ) {
    return cache.voices;
  }

  const tts = new MsEdgeTTS();
  try {
    const edgeVoices = await tts.getVoices();
    const voices = edgeVoices
      .filter((voice) => /Neural$/i.test(voice.ShortName))
      .map(mapEdgeVoice);
    cache = { at: Date.now(), voices };
    return voices;
  } finally {
    tts.close();
  }
}

export async function listVoices(language?: string): Promise<TtsVoice[]> {
  const all = await loadAllVoices();
  return filterVoices(all, language);
}

export function defaultVoiceId(language: string): string {
  const lang = normalizeLanguage(language);
  if (lang === "en") {
    return DEFAULT_VOICE_IDS.en;
  }
  if (lang === "zh" || lang === "all") {
    return DEFAULT_VOICE_IDS.zh;
  }
  return DEFAULT_VOICE_IDS.zh;
}

export async function resolveVoiceId(input: {
  voiceId?: string;
  voice?: string;
  language?: string;
}): Promise<string> {
  const language = normalizeLanguage(input.language);
  const all = await loadAllVoices();
  const byId = new Map(all.map((voice) => [voice.id, voice]));

  if (input.voiceId) {
    const found = byId.get(input.voiceId);
    if (!found) {
      throw new Error(`未知音色：${input.voiceId}`);
    }
    return found.id;
  }

  const legacy = (input.voice ?? "female").trim();
  const legacyLower = legacy.toLowerCase();
  if (legacyLower === "male" || legacyLower === "female") {
    const family = language === "en" ? "en" : "zh";
    const preferred = LEGACY_GENDER_VOICE_IDS[family][legacyLower];
    if (byId.has(preferred)) {
      return preferred;
    }
    const scoped = filterVoices(all, family);
    const anyGender = scoped.find((voice) => voice.gender === legacyLower);
    if (anyGender) {
      return anyGender.id;
    }
    return defaultVoiceId(language);
  }

  if (byId.has(legacy)) {
    return legacy;
  }

  throw new Error(`未知音色：${input.voice ?? input.voiceId ?? "(empty)"}`);
}
