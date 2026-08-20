import { describe, expect, it } from "vitest";
import type { Element } from "@ai-doodle/video-schema";
import { isDrawAnimationActive } from "./motion";

const drawing: Element = {
  id: "el-usa",
  type: "svg",
  x: 0,
  y: 0,
  animation: { type: "draw", durationInFrames: 72, easing: "linear" },
};

describe("isDrawAnimationActive", () => {
  it("is active from the first drawing frame so the hand can appear on screen one", () => {
    expect(isDrawAnimationActive(drawing, 0)).toBe(true);
    expect(isDrawAnimationActive(drawing, 71)).toBe(true);
    expect(isDrawAnimationActive(drawing, 72)).toBe(false);
  });

  it("respects delay", () => {
    const delayed: Element = {
      ...drawing,
      animation: { type: "draw", durationInFrames: 40, delayInFrames: 10, easing: "linear" },
    };
    expect(isDrawAnimationActive(delayed, 9)).toBe(false);
    expect(isDrawAnimationActive(delayed, 10)).toBe(true);
  });
});
