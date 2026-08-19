import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 44100;
const durationSeconds = 18;
const numSamples = sampleRate * durationSeconds;
const dataSize = numSamples * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < numSamples; i += 1) {
  const t = i / sampleRate;
  const envelope = Math.max(0, 1 - (t % 3) / 0.25) * (t % 3 < 0.25 ? 1 : 0);
  const sample = Math.sin(2 * Math.PI * 440 * t) * 0.12 * envelope;
  buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../public/audio");
mkdirSync(outDir, { recursive: true });
const wavPath = path.join(outDir, "demo.wav");
writeFileSync(wavPath, buffer);
console.log(`wrote ${wavPath}`);
