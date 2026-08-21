import { resolve } from "node:path";
import { Hono } from "hono";
import { audioOutPath, safeFileId, synthesizeToFile } from "../tts";
import { listVoices, resolveVoiceId } from "../voices";

type TtsBody = {
  text?: unknown;
  voiceId?: unknown;
  voice?: unknown;
  language?: unknown;
  fileId?: unknown;
  fps?: unknown;
};

export function createTtsRouter(repoRoot: string): Hono {
  const router = new Hono();

  router.get("/voices", async (c) => {
    try {
      const language = c.req.query("language") ?? "all";
      const voices = await listVoices(language);
      return c.json({ voices, total: voices.length });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return c.json(
        {
          error:
            error instanceof Error
              ? `获取音色列表失败：${error.message}`
              : "获取音色列表失败",
        },
        500,
      );
    }
  });

  router.post("/", async (c) => {
    let body: TtsBody;
    try {
      body = (await c.req.json()) as TtsBody;
    } catch {
      return c.json({ error: "请求体必须是 JSON" }, 400);
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return c.json({ error: "请先输入要合成的文案" }, 400);
    }
    if (text.length > 4000) {
      return c.json({ error: "文案过长，请控制在 4000 字以内" }, 400);
    }

    const language =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim()
        : "zh";
    const voiceId =
      typeof body.voiceId === "string" && body.voiceId.trim()
        ? body.voiceId.trim()
        : undefined;
    const voice =
      typeof body.voice === "string" && body.voice.trim()
        ? body.voice.trim()
        : undefined;

    let neuralId: string;
    try {
      neuralId = await resolveVoiceId({ voiceId, voice, language });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : "未知音色",
        },
        400,
      );
    }

    const fileId = safeFileId(
      typeof body.fileId === "string" ? body.fileId : `tts-${Date.now()}`,
    );
    const fps = typeof body.fps === "number" && body.fps > 0 ? body.fps : 30;
    const { relativeSrc, outPath } = audioOutPath(repoRoot, fileId);

    try {
      const result = await synthesizeToFile({
        text,
        voiceName: neuralId,
        outPath,
      });
      const durationInFrames = Math.max(1, Math.round(result.durationSec * fps));
      return c.json({
        src: relativeSrc,
        durationSec: result.durationSec,
        durationInFrames,
        voice: neuralId,
        provider: result.provider,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return c.json(
        {
          error:
            error instanceof Error
              ? `语音合成失败：${error.message}`
              : "语音合成失败",
        },
        500,
      );
    }
  });

  return router;
}

export function resolveRepoRoot(fromFileUrl: string): string {
  return resolve(fromFileUrl, "../../..");
}
