import { describe, expect, it } from "vitest";
import { EmptyScriptError, splitScript } from "./split-script";

describe("splitScript", () => {
  it("splits three sentences into three scenes", () => {
    const parts = splitScript("第一句。第二句。第三句。");
    expect(parts).toEqual(["第一句", "第二句", "第三句"]);
  });

  it("clamps a very long paragraph into 3–6 scenes", () => {
    const script = "这是一段没有句号的超长文案".repeat(20);
    const parts = splitScript(script);
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts.length).toBeLessThanOrEqual(6);
    expect(parts.join("").replace(/\s/g, "").length).toBeGreaterThan(40);
  });

  it("expands a short demo line into 3–6 scenes", () => {
    const parts = splitScript("为什么美国长期制裁伊朗？");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts.length).toBeLessThanOrEqual(6);
    expect(parts.some((part) => part.includes("美国"))).toBe(true);
    expect(parts.some((part) => part.includes("制裁"))).toBe(true);
    expect(parts.some((part) => part.includes("伊朗"))).toBe(true);
  });

  it("throws for empty copy", () => {
    expect(() => splitScript("   ")).toThrow(EmptyScriptError);
    expect(() => splitScript("")).toThrow(/请先输入文案/);
  });

  it("merges extra sentences down to at most six", () => {
    const parts = splitScript("一。二。三。四。五。六。七。八。九。");
    expect(parts.length).toBeLessThanOrEqual(6);
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });
});
