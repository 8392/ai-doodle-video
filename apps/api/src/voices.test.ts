import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOICE_IDS,
  defaultVoiceId,
  filterVoices,
  mapEdgeVoice,
  resolveVoiceId,
  type TtsVoice,
} from "./voices";

const sampleEdge = {
  Name: "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
  ShortName: "zh-CN-XiaoxiaoNeural",
  Gender: "Female",
  Locale: "zh-CN",
  SuggestedCodec: "audio-24khz-48kbitrate-mono-mp3",
  FriendlyName: "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
  Status: "GA",
};

const sampleCatalog: TtsVoice[] = [
  mapEdgeVoice(sampleEdge),
  mapEdgeVoice({
    ...sampleEdge,
    ShortName: "zh-CN-YunxiNeural",
    Gender: "Male",
    FriendlyName: "Yunxi",
  }),
  mapEdgeVoice({
    ...sampleEdge,
    ShortName: "en-US-AriaNeural",
    Gender: "Female",
    Locale: "en-US",
    FriendlyName: "Aria",
  }),
  mapEdgeVoice({
    ...sampleEdge,
    ShortName: "en-US-GuyNeural",
    Gender: "Male",
    Locale: "en-US",
    FriendlyName: "Guy",
  }),
  mapEdgeVoice({
    ...sampleEdge,
    ShortName: "ja-JP-NanamiNeural",
    Gender: "Female",
    Locale: "ja-JP",
    FriendlyName: "Nanami",
  }),
];

describe("tts voices", () => {
  it("maps edge voices to app labels", () => {
    const mapped = mapEdgeVoice(sampleEdge);
    expect(mapped.id).toBe("zh-CN-XiaoxiaoNeural");
    expect(mapped.language).toBe("zh");
    expect(mapped.gender).toBe("female");
    expect(mapped.default).toBe(true);
    expect(mapped.label).toContain("Xiaoxiao");
    expect(mapped.label).toContain("zh-CN");
  });

  it("filters by language family and keeps all when all", () => {
    expect(filterVoices(sampleCatalog, "zh")).toHaveLength(2);
    expect(filterVoices(sampleCatalog, "en")).toHaveLength(2);
    expect(filterVoices(sampleCatalog, "ja")).toHaveLength(1);
    expect(filterVoices(sampleCatalog, "all").length).toBe(sampleCatalog.length);
  });

  it("defaults to Xiaoxiao / Aria", () => {
    expect(defaultVoiceId("zh")).toBe(DEFAULT_VOICE_IDS.zh);
    expect(defaultVoiceId("en")).toBe(DEFAULT_VOICE_IDS.en);
  });
});

describe("resolveVoiceId (live catalog)", () => {
  it(
    "resolves voiceId and legacy male/female against Edge list",
    async () => {
      expect(await resolveVoiceId({ voiceId: "zh-CN-YunyangNeural" })).toBe(
        "zh-CN-YunyangNeural",
      );
      expect(await resolveVoiceId({ voice: "female", language: "zh" })).toBe(
        DEFAULT_VOICE_IDS.zh,
      );
      expect(await resolveVoiceId({ voice: "male", language: "en" })).toBe(
        "en-US-GuyNeural",
      );
    },
    60_000,
  );

  it(
    "rejects unknown voiceId",
    async () => {
      await expect(resolveVoiceId({ voiceId: "not-a-voice" })).rejects.toThrow(
        /未知音色/,
      );
    },
    60_000,
  );
});
