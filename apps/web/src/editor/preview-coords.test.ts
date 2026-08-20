import { describe, expect, it } from "vitest";
import type { Element, VideoProject } from "@ai-doodle/video-schema";
import {
  compositionToContainerPoint,
  dropPointToElementOrigin,
  getCompositionDisplayRect,
  hitTestElement,
  overlayRectToElementPatch,
  screenToCompositionPoint,
} from "./preview-coords";

describe("preview-coords", () => {
  it("computes letterboxed display rect", () => {
    const rect = getCompositionDisplayRect(400, 800, 1080, 1920);
    expect(rect.width).toBe(400);
    expect(rect.height).toBeCloseTo(400 * (1920 / 1080));
    expect(rect.top).toBeGreaterThan(0);
  });

  it("maps screen point to composition space without camera", () => {
    const containerRect = { left: 0, top: 0, width: 540, height: 960 };
    const point = screenToCompositionPoint({
      clientX: 270,
      clientY: 480,
      containerRect,
      compositionWidth: 1080,
      compositionHeight: 1920,
      camera: { x: 0, y: 0, scale: 1 },
    });
    expect(point).toEqual({ x: 540, y: 960 });
  });

  it("centers element on drop point", () => {
    const origin = dropPointToElementOrigin({
      point: { x: 540, y: 960 },
      elementWidth: 400,
      elementHeight: 320,
      compositionWidth: 1080,
      compositionHeight: 1920,
    });
    expect(origin).toEqual({ x: 340, y: 800 });
  });

  it("inverts screen mapping at the composition center", () => {
    const containerRect = { left: 0, top: 0, width: 540, height: 960 };
    const camera = { x: 0, y: 0, scale: 1 };
    const point = screenToCompositionPoint({
      clientX: 270,
      clientY: 480,
      containerRect,
      compositionWidth: 1080,
      compositionHeight: 1920,
      camera,
    });
    expect(point).not.toBeNull();
    const back = compositionToContainerPoint({
      x: point!.x,
      y: point!.y,
      containerWidth: 540,
      containerHeight: 960,
      compositionWidth: 1080,
      compositionHeight: 1920,
      camera,
    });
    expect(back.x).toBeCloseTo(270);
    expect(back.y).toBeCloseTo(480);
  });

  it("hits the topmost overlapping element", () => {
    const behind: Element = {
      id: "behind",
      type: "svg",
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      zIndex: 1,
    };
    const front: Element = {
      id: "front",
      type: "svg",
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      zIndex: 4,
    };
    expect(hitTestElement([behind, front], { x: 80, y: 80 })?.id).toBe("front");
    expect(hitTestElement([behind, front], { x: 10, y: 10 })?.id).toBe("behind");
  });
});

describe("resolveCameraAtFrame", () => {
  it("uses scene camera at local frame", async () => {
    const { resolveCameraAtFrame } = await import("./project-edits");
    const project: VideoProject = {
      id: "demo",
      name: "Demo",
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 120,
      background: { type: "paper", color: "#fff" },
      language: "zh",
      scenes: [
        {
          id: "s1",
          startFrame: 0,
          durationInFrames: 60,
          elements: [],
          camera: { x: 0, y: 0, scale: 1, durationInFrames: 30 },
        },
        {
          id: "s2",
          startFrame: 60,
          durationInFrames: 60,
          elements: [],
          camera: { x: 0, y: -200, scale: 1.2, durationInFrames: 30 },
        },
      ],
    };
    expect(resolveCameraAtFrame(project, 75).y).toBe(-200);
    expect(resolveCameraAtFrame(project, 60).y).toBe(-200);
  });

  it("converts an overlay box back into element x/y/width/height", () => {
    const patch = overlayRectToElementPatch({
      left: 135,
      top: 240,
      width: 270,
      height: 480,
      containerRect: { left: 0, top: 0, width: 540, height: 960 },
      compositionWidth: 1080,
      compositionHeight: 1920,
      camera: { x: 0, y: 0, scale: 1 },
    });
    expect(patch).toEqual({
      x: 270,
      y: 480,
      width: 540,
      height: 960,
      scale: 1,
    });
  });
});
