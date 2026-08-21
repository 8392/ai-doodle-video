import { describe, expect, it } from "vitest";
import { inferTheme, shortlistAssetsForTheme } from "./themes";
import { matchAssetsForNarration } from "./match-assets";
import { assets } from "@ai-doodle/asset-library";

describe("inferTheme", () => {
  it("detects science from greenhouse script", () => {
    expect(inferTheme("什么是温室效应？太阳光进入地球大气层")).toBe("science");
  });

  it("detects finance from market script", () => {
    expect(inferTheme("资本用时间买壁垒，利润出现在第二阶段")).toBe("finance");
  });
});

describe("theme matching", () => {
  it("prefers science-tagged icons for greenhouse narration", () => {
    const ids = matchAssetsForNarration("温室气体像毯子一样把热量留住", [], {
      theme: "science",
      scriptContext: "什么是温室效应？",
    }).map((asset) => asset.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.some((id) => id === "gas" || id === "globe")).toBe(true);
  });

  it("shortlists fewer geopolitics icons for science", () => {
    const list = shortlistAssetsForTheme(assets, "science", 80);
    expect(list.length).toBeLessThanOrEqual(80);
    expect(list.some((asset) => asset.id === "gas" || asset.id === "globe")).toBe(
      true,
    );
  });
});
