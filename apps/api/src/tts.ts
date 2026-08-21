import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function safeFileId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || `tts-${Date.now()}`;
}

function durationFromMp3Bytes(byteLength: number): number {
  // AUDIO_24KHZ_48KBITRATE_MONO_MP3 ≈ 6000 bytes/sec
  return Math.max(0.5, byteLength / 6000);
}

export async function synthesizeToFile(options: {
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

    const { audioStream } = tts.toStream(escapeXml(options.text), {
      rate: 0.95,
    });
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

export function audioOutPath(repoRoot: string, fileId: string): {
  relativeSrc: string;
  outPath: string;
} {
  const relativeSrc = `/audio/tts/${fileId}.mp3`;
  const outPath = resolve(repoRoot, "public", relativeSrc.slice(1));
  return { relativeSrc, outPath };
}
