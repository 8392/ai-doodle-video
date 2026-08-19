import { describe, expect, it } from "vitest";
import { clamp, fitHandInFrame, worldToScreen } from "./hand-layout";

describe("fitHandInFrame", () => {
  it("keeps the hand inside the frame near the top-left", () => {
    const box = fitHandInFrame({
      tipX: -40,
      tipY: -20,
      handWidth: 260,
      handHeight: 260,
      frameWidth: 1080,
      frameHeight: 1920,
      padding: 8,
    });
    expect(box.left).toBe(8);
    expect(box.top).toBe(8);
  });

  it("keeps the hand inside the frame near the bottom-right", () => {
    const box = fitHandInFrame({
      tipX: 2000,
      tipY: 3000,
      handWidth: 260,
      handHeight: 260,
      frameWidth: 1080,
      frameHeight: 1920,
      padding: 8,
    });
    expect(box.left).toBe(1080 - 260 - 8);
    expect(box.top).toBe(1920 - 260 - 8);
  });
});

describe("worldToScreen", () => {
  it("leaves the center unchanged when camera is identity", () => {
    const point = worldToScreen(540, 960, { x: 0, y: 0, scale: 1 }, 1080, 1920);
    expect(point.x).toBe(540);
    expect(point.y).toBe(960);
  });
});

describe("clamp", () => {
  it("clamps to range", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});
