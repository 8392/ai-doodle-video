import { describe, expect, it } from "vitest";
import { matchAssetsForNarration } from "./match-assets";

describe("matchAssetsForNarration", () => {
  it("matches the USA flag for 美国", () => {
    const ids = matchAssetsForNarration("美国").map((asset) => asset.id);
    expect(ids).toContain("usa");
    expect(ids).not.toContain("hand-left");
    expect(ids).not.toContain("hand-right");
  });

  it("matches oil-related icons for 石油", () => {
    const ids = matchAssetsForNarration("石油").map((asset) => asset.id);
    expect(ids.some((id) => id === "oil" || id === "oil-factory" || id === "oil-barrel")).toBe(
      true,
    );
    expect(ids).not.toContain("hand-left");
  });

  it("matches sanctions for 制裁", () => {
    const ids = matchAssetsForNarration("制裁").map((asset) => asset.id);
    expect(ids).toContain("sanctions");
  });

  it("falls back when nothing matches", () => {
    const ids = matchAssetsForNarration("xyzabc123notatag").map((asset) => asset.id);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids).toContain("globe");
    expect(ids).not.toContain("hand-left");
  });

  it("does not reuse the same fallback on later unmatched scenes", () => {
    const first = matchAssetsForNarration("完全没有标签的句子甲");
    const second = matchAssetsForNarration("另一段也不匹配的内容乙", first.map((asset) => asset.id));
    expect(first[0]?.id).toBe("globe");
    expect(second[0]?.id).toBe("newspaper");
    expect(second[0]?.id).not.toBe(first[0]?.id);
  });

  it("picks a different strong match for a later scene when possible", () => {
    const first = matchAssetsForNarration("美国");
    const second = matchAssetsForNarration(
      "石油",
      first.map((asset) => asset.id),
    );
    expect(first.map((asset) => asset.id)).toContain("usa");
    expect(
      second.some((asset) => asset.id === "oil" || asset.id === "oil-factory" || asset.id === "oil-barrel"),
    ).toBe(true);
    expect(second[0]?.id).not.toBe(first[0]?.id);
  });
});
