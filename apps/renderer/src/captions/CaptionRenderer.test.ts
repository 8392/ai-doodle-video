import { describe, expect, it } from "vitest";
import {
  captionLineIndex,
  splitCaptionLines,
} from "./CaptionRenderer";

describe("caption line paging", () => {
  it("keeps short text as a single line", () => {
    expect(splitCaptionLines("短句旁白")).toEqual(["短句旁白"]);
  });

  it("splits long text into fixed-width lines without shrinking", () => {
    const lines = splitCaptionLines(
      "美国希望通过展示强大的军事力量让伊朗意识到继续发展核能力将付出巨大代价",
      16,
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect([...line].length).toBeLessThanOrEqual(16);
    }
  });

  it("pages through lines across the caption duration", () => {
    expect(captionLineIndex(0, 0, 90, 3)).toBe(0);
    expect(captionLineIndex(30, 0, 90, 3)).toBe(1);
    expect(captionLineIndex(60, 0, 90, 3)).toBe(2);
    expect(captionLineIndex(89, 0, 90, 3)).toBe(2);
  });
});
