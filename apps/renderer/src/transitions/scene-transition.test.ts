import { describe, expect, it } from "vitest";
import {
  incomingTransitionProgress,
  resolveSceneTransition,
  sceneLayerStyle,
} from "./scene-transition";
import type { Scene, VideoProject } from "@ai-doodle/video-schema";

const scene = (id: string, transition?: Scene["transition"]): Scene => ({
  id,
  startFrame: id === "s1" ? 0 : 90,
  durationInFrames: 90,
  elements: [{ id: `${id}-el`, type: "svg", x: 0, y: 0 }],
  transition,
});

const project: VideoProject = {
  id: "demo",
  name: "Demo",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 180,
  background: { type: "paper", color: "#fff" },
  language: "zh",
  defaultTransition: { type: "fade", durationInFrames: 18 },
  scenes: [scene("s1"), scene("s2", { type: "slide-left", durationInFrames: 12 })],
};

describe("scene transitions", () => {
  it("uses the scene override when present", () => {
    expect(resolveSceneTransition(project, project.scenes[1]!).type).toBe("slide-left");
  });

  it("falls back to the project default", () => {
    expect(resolveSceneTransition(project, project.scenes[0]!).type).toBe("fade");
  });

  it("skips the incoming animation on the first scene", () => {
    expect(
      incomingTransitionProgress(0, 0, { type: "fade", durationInFrames: 18 }, 90),
    ).toBe(1);
  });

  it("slides the incoming scene in from the right", () => {
    const style = sceneLayerStyle("in", "slide-left", 0, 1080, 1920);
    expect(style.transform).toBe("translate(1080px, 0px)");
  });
});
