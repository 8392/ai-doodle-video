import { describe, expect, it } from "vitest";
import type { VideoProject } from "@ai-doodle/video-schema";
import {
  addAssetToScene,
  addPrimitiveToScene,
  addScene,
  applyAspectRatio,
  flattenSceneCameras,
  moveElementInScene,
  moveScene,
  removeElement,
  removeScene,
  retimeProject,
  scaleProjectToSize,
  setDefaultTransition,
  setProjectName,
  setSceneTransition,
  updateElement,
  updateScene,
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

  it("scales project elements when resizing canvas", () => {
    const next = scaleProjectToSize(project, 1920, 1080);
    expect(next.width).toBe(1920);
    expect(next.height).toBe(1080);
    expect(next.scenes[0]?.elements[0]).toMatchObject({
      x: Math.round(10 * (1920 / 1080)),
      y: Math.round(20 * (1080 / 1920)),
    });
  });

  it("adds a text primitive to the scene", () => {
    const { project: next, elementId } = addPrimitiveToScene(project, "s1", "text", {
      x: 40,
      y: 80,
    });
    const element = next.scenes[0]?.elements.find((item) => item.id === elementId);
    expect(element).toMatchObject({ type: "text", x: 40, y: 80, text: "新标题" });
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

  it("retimes start frames, duration, and one caption per scene", () => {
    const next = retimeProject({
      ...project,
      durationInFrames: 10,
      captions: [{ text: "旧字幕", startFrame: 0, endFrame: 10 }],
      scenes: [
        {
          id: "s1",
          startFrame: 99,
          durationInFrames: 30,
          narration: "第一段",
          elements: [],
        },
        {
          id: "s2",
          startFrame: 0,
          durationInFrames: 45,
          narration: "第二段",
          elements: [],
        },
      ],
    });
    expect(next.durationInFrames).toBe(75);
    expect(next.scenes[0]).toMatchObject({ id: "s1", startFrame: 0 });
    expect(next.scenes[1]).toMatchObject({ id: "s2", startFrame: 30 });
    expect(next.captions).toEqual([
      { text: "第一段", startFrame: 0, endFrame: 30, style: undefined },
      { text: "第二段", startFrame: 30, endFrame: 75, style: undefined },
    ]);
  });

  it("adds a scene after the current one and keeps captions aligned", () => {
    const twoScenes = retimeProject({
      ...project,
      scenes: [
        project.scenes[0]!,
        {
          id: "s2",
          startFrame: 90,
          durationInFrames: 60,
          narration: "第二段",
          elements: [],
        },
      ],
    });
    const { project: next, sceneId } = addScene(twoScenes, "s1");
    expect(next.scenes.map((scene) => scene.id)).toEqual(["s1", sceneId, "s2"]);
    expect(next.scenes[1]).toMatchObject({
      id: sceneId,
      startFrame: 90,
      durationInFrames: 90,
      narration: "新场景",
      elements: [],
    });
    expect(next.durationInFrames).toBe(240);
    expect(next.captions?.map((caption) => caption.text)).toEqual([
      "Scene 1",
      "新场景",
      "第二段",
    ]);
  });

  it("refuses to remove the last remaining scene", () => {
    expect(removeScene(project, "s1")).toBe(project);
  });

  it("removes a scene and rewrites later start frames", () => {
    const twoScenes = retimeProject({
      ...project,
      scenes: [
        { ...project.scenes[0]!, narration: "第一段" },
        {
          id: "s2",
          startFrame: 90,
          durationInFrames: 60,
          narration: "第二段",
          elements: [],
        },
      ],
    });
    const next = removeScene(twoScenes, "s1");
    expect(next.scenes).toHaveLength(1);
    expect(next.scenes[0]).toMatchObject({ id: "s2", startFrame: 0 });
    expect(next.durationInFrames).toBe(60);
    expect(next.captions?.[0]?.text).toBe("第二段");
  });

  it("moves a scene and keeps its caption", () => {
    const twoScenes = retimeProject({
      ...project,
      scenes: [
        { ...project.scenes[0]!, narration: "第一段" },
        {
          id: "s2",
          startFrame: 90,
          durationInFrames: 60,
          narration: "第二段",
          elements: [],
        },
      ],
    });
    const next = moveScene(twoScenes, "s2", -1);
    expect(next.scenes.map((scene) => scene.id)).toEqual(["s2", "s1"]);
    expect(next.scenes[0]?.startFrame).toBe(0);
    expect(next.scenes[1]?.startFrame).toBe(60);
    expect(next.captions?.map((caption) => caption.text)).toEqual([
      "第二段",
      "第一段",
    ]);
  });

  it("updates scene duration and narration", () => {
    const next = updateScene(project, "s1", {
      durationInFrames: 120,
      narration: "新旁白",
    });
    expect(next.scenes[0]).toMatchObject({
      durationInFrames: 120,
      narration: "新旁白",
    });
    expect(next.durationInFrames).toBe(120);
    expect(next.captions?.[0]?.text).toBe("新旁白");
  });

  it("reorders elements in a scene", () => {
    const withTwo = {
      ...project,
      scenes: [
        {
          ...project.scenes[0]!,
          elements: [
            { id: "el-1", type: "svg" as const, assetId: "usa", x: 0, y: 0 },
            { id: "el-2", type: "svg" as const, assetId: "dollar", x: 10, y: 10 },
          ],
        },
      ],
    };
    const down = moveElementInScene(withTwo, "s1", "el-1", 1);
    expect(down.scenes[0]?.elements.map((element) => element.id)).toEqual([
      "el-2",
      "el-1",
    ]);
    expect(
      moveElementInScene(withTwo, "s1", "el-1", -1).scenes[0]?.elements.map(
        (element) => element.id,
      ),
    ).toEqual(["el-1", "el-2"]);
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
