import { describe, expect, it } from "vitest";
import { parseVideoProject } from "@ai-doodle/video-schema";
import { unwrapProjectJson } from "./project-json";

const project = {
  id: "demo",
  name: "Demo",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 90,
  background: { type: "paper", color: "#F6F1E7" },
  language: "zh",
  scenes: [
    {
      id: "s1",
      startFrame: 0,
      durationInFrames: 90,
      elements: [],
    },
  ],
};

describe("unwrapProjectJson", () => {
  it("returns a VideoProject as-is", () => {
    expect(parseVideoProject(unwrapProjectJson(project)).id).toBe("demo");
  });

  it("unwraps Remotion --props shape", () => {
    expect(parseVideoProject(unwrapProjectJson({ project })).id).toBe("demo");
  });
});
