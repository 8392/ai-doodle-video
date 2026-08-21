import { retimeProject, type VideoProject } from "@ai-doodle/video-schema";
import { describe, expect, it } from "vitest";
import { applyNarrationAudio, buildNarrationScript } from "./narration-audio";

function sampleProject(): VideoProject {
  return {
    id: "proj-test",
    name: "测试",
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 270,
    background: { type: "paper", color: "#E7E7E7" },
    language: "zh",
    scenes: [
      {
        id: "s1",
        startFrame: 0,
        durationInFrames: 90,
        narration: "短",
        elements: [],
      },
      {
        id: "s2",
        startFrame: 90,
        durationInFrames: 90,
        narration: "这一段旁白更长一些用来加权",
        elements: [],
      },
      {
        id: "s3",
        startFrame: 180,
        durationInFrames: 90,
        narration: "中等长度旁白",
        elements: [],
      },
    ],
  };
}

describe("applyNarrationAudio", () => {
  it("attaches narration and retimes scenes to audio length", () => {
    const next = applyNarrationAudio(sampleProject(), {
      src: "/audio/tts/proj-test-narration.mp3",
      durationInFrames: 300,
    });
    expect(next.narration?.src).toBe("/audio/tts/proj-test-narration.mp3");
    expect(next.durationInFrames).toBe(
      next.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0),
    );
    expect(next.narration?.durationInFrames).toBeGreaterThanOrEqual(300);
    const mid = next.scenes[1];
    const short = next.scenes[0];
    expect((mid?.durationInFrames ?? 0) > (short?.durationInFrames ?? 0)).toBe(
      true,
    );
    expect(next.captions?.length).toBe(3);
  });

  it("builds a spoken script from scene narrations", () => {
    expect(buildNarrationScript(sampleProject())).toContain("短");
    expect(buildNarrationScript(retimeProject(sampleProject()))).toContain("。");
  });
});
