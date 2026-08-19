import { describe, expect, it } from "vitest";
import type { VideoProject } from "@ai-doodle/video-schema";
import { addAssetToScene, applyAspectRatio, setProjectName, updateElement } from "./project-edits";

const project: VideoProject = {
  id: "demo",
  name: "Demo",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 90,
  background: { type: "paper", color: "#F4EFE4" },
  language: "zh",
  scenes: [
    {
      id: "s1",
      startFrame: 0,
      durationInFrames: 90,
      elements: [{ id: "el-1", type: "svg", assetId: "usa", x: 10, y: 20, scale: 1 }],
    },
  ],
};

describe("project-edits", () => {
  it("renames a project", () => {
    expect(setProjectName(project, "New").name).toBe("New");
  });

  it("updates element position", () => {
    const next = updateElement(project, "el-1", { x: 40, y: 80, scale: 1.2 });
    expect(next.scenes[0]?.elements[0]).toMatchObject({ x: 40, y: 80, scale: 1.2 });
  });

  it("adds an svg asset to a scene", () => {
    const { project: next, elementId } = addAssetToScene(project, "s1", {
      id: "dollar",
      name: "美元",
      category: "economy",
      tags: ["美元"],
      src: "/assets/economy/dollar.svg",
      type: "svg",
    });
    expect(next.scenes[0]?.elements).toHaveLength(2);
    expect(next.scenes[0]?.elements.some((element) => element.id === elementId)).toBe(true);
  });

  it("switches aspect ratio", () => {
    const wide = applyAspectRatio(project, "16:9");
    expect(wide.width).toBe(1920);
    expect(wide.height).toBe(1080);
  });
});
