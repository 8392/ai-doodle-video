import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Tone = {
  hz: number;
  gain: number;
};

function writeWav(path: string, tones: Tone[], seconds = 8): void {
  const sampleRate = 22050;
  const samples = Math.floor(sampleRate * seconds);
  const header = Buffer.alloc(44);
  const dataBytes = samples * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataBytes, 40);
  const pcm = Buffer.alloc(dataBytes);
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    let sample = 0;
    for (const tone of tones) {
      sample += Math.sin(2 * Math.PI * tone.hz * t) * tone.gain;
    }
    const envelope = 0.35 + 0.15 * Math.sin((2 * Math.PI * t) / 4);
    const value = Math.max(-1, Math.min(1, sample * envelope));
    pcm.writeInt16LE(Math.round(value * 20000), i * 2);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.concat([header, pcm]));
}

export function ensureMusicBeds(repoRoot: string): void {
  const dir = resolve(repoRoot, "public/audio/music");
  writeWav(resolve(dir, "soft.wav"), [
    { hz: 196, gain: 0.22 },
    { hz: 294, gain: 0.12 },
  ]);
  writeWav(resolve(dir, "documentary.wav"), [
    { hz: 146.8, gain: 0.2 },
    { hz: 220, gain: 0.1 },
  ]);
  writeWav(resolve(dir, "upbeat.wav"), [
    { hz: 261.6, gain: 0.16 },
    { hz: 329.6, gain: 0.1 },
    { hz: 392, gain: 0.08 },
  ]);
}
