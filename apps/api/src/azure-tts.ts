import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { escapeXml } from "./tts";

export function azureTtsConfigured(): boolean {
  return Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
}

export async function synthesizeAzureToFile(options: {
  text: string;
  voiceName: string;
  outPath: string;
}): Promise<number> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    throw new Error("未配置 AZURE_SPEECH_KEY / AZURE_SPEECH_REGION");
  }
  const locale = options.voiceName.split("-").slice(0, 2).join("-") || "zh-CN";
  const ssml = `<speak version="1.0" xml:lang="${locale}"><voice name="${options.voiceName}">${escapeXml(options.text)}</voice></speak>`;
  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "ai-doodle-video",
      },
      body: ssml,
    },
  );
  if (!response.ok) {
    throw new Error(`Azure TTS ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("Azure TTS 返回空音频");
  }
  mkdirSync(dirname(options.outPath), { recursive: true });
  writeFileSync(options.outPath, buffer);
  return Math.max(0.5, buffer.byteLength / 6000);
}
