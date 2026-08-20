import { describe, expect, it } from "vitest";
import type { Element } from "@ai-doodle/video-schema";
import { sequenceElementAnimations } from "./sequence";

describe("sequenceElementAnimations", () => {
  it("starts each icon after the previous one finishes", () => {
    const elements: Element[] = [
      {
        id: "a",
        type: "svg",
        x: 0,
        y: 0,
        animation: { type: "draw", durationInFrames: 40, easing: "linear" },
      },
      {
        id: "b",
        type: "svg",
        x: 10,
        y: 10,
        animation: { type: "draw", durationInFrames: 30, delayInFrames: 0, easing: "linear" },
      },
    ];
    const sequenced = sequenceElementAnimations(elements, 6);
    expect(sequenced[0]?.animation?.delayInFrames).toBe(0);
    expect(sequenced[1]?.animation?.delayInFrames).toBe(46);
  });
});
