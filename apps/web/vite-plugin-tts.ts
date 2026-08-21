import { mkdirSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import type { Plugin } from "vite";

type TtsBody = {
  text?: unknown;
  voice?: unknown;
  language?: unknown;
  fileId?: unknown;
  fps?: unknown;
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function pathnameOf(req: IncomingMessage): string {
  const url = req.url ?? "/";
  const query = url.indexOf("?");
  return query >= 0 ? url.slice(0, query) : url;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function resolveVoice(language: string, voice: string): string {
  const lang = language.toLowerCase().startsWith("en") ? "en" : "zh";
  const gender = voice === "male" ? "male" : "female";
  if (lang === "en") {
    return gender === "male" ? "en-US-GuyNeural" : "en-US-AriaNeural";
  }
  return gender === "male" ? "zh-CN-YunxiNeural" : "zh-CN-XiaoxiaoNeural";
}

function safeFileId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || `tts-${Date.now()}`;
}

function durationFromMp3Bytes(byteLength: number): number {
  // AUDIO_24KHZ_48KBITRATE_MONO_MP3 ≈ 6000 bytes/sec
  return Math.max(0.5, byteLength / 6000);
}

async function synthesizeToFile(options: {
  text: string;
  voiceName: string;
  outPath: string;
}): Promise<number> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(
      options.voiceName,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );

    const { audioStream } = tts.toStream(escapeXml(options.text), { rate: 0.95 });
    const chunks: Buffer[] = [];
    await new Promise<void>((resolveStream, rejectStream) => {
      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolveStream();
      };
      audioStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      audioStream.on("error", (error) => {
        if (!settled) {
          settled = true;
          rejectStream(error);
        }
      });
      audioStream.on("end", finish);
      audioStream.on("close", finish);
    });

    const buffer = Buffer.concat(chunks);
    if (buffer.byteLength === 0) {
      throw new Error("语音合成为空");
    }
    mkdirSync(dirname(options.outPath), { recursive: true });
    writeFileSync(options.outPath, buffer);
    return durationFromMp3Bytes(buffer.byteLength);
  } finally {
    tts.close();
  }
}

export function ttsPlugin(repoRoot: string): Plugin {
  return {
    name: "ai-doodle-tts-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || pathnameOf(req) !== "/api/tts") {
          next();
          return;
        }

        void (async () => {
          try {
            const body = JSON.parse(await readBody(req)) as TtsBody;
            const text = typeof body.text === "string" ? body.text.trim() : "";
            if (!text) {
              sendJson(res, 400, { error: "请先输入要合成的文案" });
              return;
            }
            if (text.length > 4000) {
              sendJson(res, 400, { error: "文案过长，请控制在 4000 字以内" });
              return;
            }

            const language =
              typeof body.language === "string" && body.language.trim()
                ? body.language.trim()
                : "zh";
            const voice =
              typeof body.voice === "string" && body.voice.trim()
                ? body.voice.trim()
                : "female";
            const fileId = safeFileId(
              typeof body.fileId === "string" ? body.fileId : `tts-${Date.now()}`,
            );
            const fps =
              typeof body.fps === "number" && body.fps > 0 ? body.fps : 30;

            const relativeSrc = `/audio/tts/${fileId}.mp3`;
            const outPath = resolve(repoRoot, "public", relativeSrc.slice(1));
            const durationSec = await synthesizeToFile({
              text,
              voiceName: resolveVoice(language, voice),
              outPath,
            });
            const durationInFrames = Math.max(1, Math.round(durationSec * fps));

            sendJson(res, 200, {
              src: relativeSrc,
              durationSec,
              durationInFrames,
              voice: resolveVoice(language, voice),
            });
          } catch (error) {
            server.config.logger.error(
              error instanceof Error ? error.message : String(error),
            );
            sendJson(res, 500, {
              error:
                error instanceof Error
                  ? `语音合成失败：${error.message}`
                  : "语音合成失败",
            });
          }
        })();
      });
    },
  };
}
