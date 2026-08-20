import { describe, expect, it } from "vitest";
import type { VideoProject } from "@ai-doodle/video-schema";
import {
  addAssetToScene,
  applyAspectRatio,
  flattenSceneCameras,
  removeElement,
  setDefaultTransition,
  setProjectName,
  setSceneTransition,
  updateElement,
} from "./project-edits";

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

  it("adds an svg asset to a scene at a custom position", () => {
    const { project: next, elementId } = addAssetToScene(
      project,
      "s1",
      {
        id: "dollar",
        name: "美元",
        category: "economy",
        tags: ["美元"],
        src: "/assets/economy/dollar.svg",
        type: "svg",
      },
      { x: 120, y: 240 },
    );
    const element = next.scenes[0]?.elements.find((item) => item.id === elementId);
    expect(element).toMatchObject({ x: 120, y: 240 });
  });

  it("switches aspect ratio", () => {
    const wide = applyAspectRatio(project, "16:9");
    expect(wide.width).toBe(1920);
    expect(wide.height).toBe(1080);
  });

  it("removes an element from the scene", () => {
    const next = removeElement(project, "el-1");
    expect(next.scenes[0]?.elements).toHaveLength(0);
  });

  it("flattens a panning camera into on-screen coordinates", () => {
    const stacked: VideoProject = {
      ...project,
      scenes: [
        {
          id: "s1",
          startFrame: 0,
          durationInFrames: 90,
          camera: { x: 0, y: -620, scale: 1, durationInFrames: 24 },
          elements: [{ id: "el-1", type: "svg", assetId: "usa", x: 160, y: 980 }],
        },
      ],
    };
    const next = flattenSceneCameras(stacked);
    expect(next.scenes[0]?.camera).toMatchObject({ x: 0, y: 0, scale: 1 });
    expect(next.scenes[0]?.elements[0]?.y).toBe(360);
  });

  it("stores a per-scene transition override", () => {
    const withDefault = setDefaultTransition(project, {
      type: "fade",
      durationInFrames: 18,
    });
    const next = setSceneTransition(withDefault, "s1", {
      type: "slide-left",
      durationInFrames: 12,
    });
    expect(next.scenes[0]?.transition).toMatchObject({ type: "slide-left" });
  });
});
