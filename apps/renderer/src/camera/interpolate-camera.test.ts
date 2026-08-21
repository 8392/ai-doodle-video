import { applyEasing } from "@ai-doodle/animation-engine";
import type { VideoProject } from "@ai-doodle/video-schema";
import { describe, expect, it } from "vitest";
import { interpolateCamera } from "./interpolate-camera";

const project: VideoProject = {
  id: "cam",
  name: "cam",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 90,
  background: { type: "paper", color: "#eee" },
  language: "zh",
  scenes: [
    {
      id: "s1",
      startFrame: 0,
      durationInFrames: 90,
      elements: [],
      camera: { x: 40, y: -20, scale: 1.2, durationInFrames: 90, easing: "linear" },
    },
  ],
};

describe("interpolateCamera", () => {
  it("starts at identity and reaches the scene camera", () => {
    const start = interpolateCamera(project, 0, 0);
    const end = interpolateCamera(project, 0, 90);
    expect(start).toMatchObject({ x: 0, y: 0, scale: 1 });
    expect(end.x).toBeCloseTo(40);
    expect(end.y).toBeCloseTo(-20);
    expect(end.scale).toBeCloseTo(1.2);
  });

  it("eases through the middle of the move", () => {
    const mid = interpolateCamera(project, 0, 45);
    expect(mid.scale).toBeCloseTo(1.1);
    expect(applyEasing(0.5, "linear")).toBe(0.5);
  });
});
