import { describe, expect, it } from "vitest";
import type { VideoProject } from "@ai-doodle/video-schema";
import { visibleScenes } from "./scenes";

function projectWith(
  defaultTransition: VideoProject["defaultTransition"],
): VideoProject {
  return {
    id: "demo",
    name: "Demo",
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 180,
    background: { type: "paper", color: "#E7E7E7" },
    language: "zh",
    defaultTransition,
    scenes: [
      {
        id: "s1",
        startFrame: 0,
        durationInFrames: 90,
        elements: [{ id: "el-1", type: "svg", x: 0, y: 0 }],
      },
      {
        id: "s2",
        startFrame: 90,
        durationInFrames: 90,
        elements: [{ id: "el-2", type: "svg", x: 0, y: 0 }],
      },
    ],
  };
}

describe("visibleScenes", () => {
  it("only returns the current scene after a hard cut", () => {
    const project = projectWith({ type: "none", durationInFrames: 1 });
    expect(visibleScenes(project, 0).map((scene) => scene.id)).toEqual(["s1"]);
    expect(visibleScenes(project, 90).map((scene) => scene.id)).toEqual(["s2"]);
  });

  it("keeps the previous scene only while the incoming transition plays", () => {
    const project = projectWith({ type: "fade", durationInFrames: 18 });
    expect(visibleScenes(project, 90).map((scene) => scene.id)).toEqual(["s1", "s2"]);
    expect(visibleScenes(project, 120).map((scene) => scene.id)).toEqual(["s2"]);
  });
});
