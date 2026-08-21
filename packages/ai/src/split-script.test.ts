import { describe, expect, it } from "vitest";
import {
  EmptyScriptError,
  MAX_CHARS_PER_SCENE,
  MAX_SCENES_SOFT,
  splitScript,
  splitScriptWithMeta,
} from "./split-script";

describe("splitScript", () => {
  it("splits three sentences into three scenes", () => {
    const parts = splitScript("第一句。第二句。第三句。");
    expect(parts).toEqual(["第一句", "第二句", "第三句"]);
  });

  it("splits a very long paragraph into many short scenes", () => {
    const script = "这是一段没有句号的超长文案".repeat(20);
    const parts = splitScript(script);
    expect(parts.length).toBeGreaterThan(6);
    expect(parts.length).toBeLessThanOrEqual(MAX_SCENES_SOFT);
    for (const part of parts) {
      expect([...part].length).toBeLessThanOrEqual(MAX_CHARS_PER_SCENE);
    }
    expect(parts.join("").replace(/\s/g, "").length).toBeGreaterThan(40);
  });

  it("expands a short demo line into at least three scenes", () => {
    const parts = splitScript("为什么美国长期制裁伊朗？");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts.some((part) => part.includes("美国"))).toBe(true);
    expect(parts.some((part) => part.includes("制裁"))).toBe(true);
    expect(parts.some((part) => part.includes("伊朗"))).toBe(true);
  });

  it("throws for empty copy", () => {
    expect(() => splitScript("   ")).toThrow(EmptyScriptError);
    expect(() => splitScript("")).toThrow(/请先输入文案/);
  });

  it("keeps many short sentences as separate scenes", () => {
    const parts = splitScript("一。二。三。四。五。六。七。八。九。");
    expect(parts.length).toBe(9);
    expect(parts).toEqual(["一", "二", "三", "四", "五", "六", "七", "八", "九"]);
  });

  it("splits long geopolitical copy into more than six scenes", () => {
    const script =
      "美国希望通过展示强大的军事力量，让伊朗意识到继续发展核能力、攻击美国及其盟友或威胁国际航运将付出巨大代价。" +
      "不过，军事打击也存在巨大风险，可能造成地区战争扩大、油价上涨以及美国自身人员伤亡。" +
      "因此，美国打伊朗并不能简单理解为“为了石油”或者“为了核武器”。" +
      "核问题、以色列安全、地区霸权竞争、伊朗代理人武装、霍尔木兹海峡以及美国全球战略利益，共同构成了这场冲突背后的复杂原因。";
    const { parts, truncated } = splitScriptWithMeta(script);
    expect(parts.length).toBeGreaterThan(6);
    expect(truncated).toBe(false);
    for (const part of parts) {
      expect([...part].length).toBeLessThanOrEqual(MAX_CHARS_PER_SCENE);
    }
  });

  it("soft-caps extreme scripts at MAX_SCENES_SOFT", () => {
    const script = Array.from({ length: 80 }, (_, i) => `句子${i + 1}`).join("。");
    const { parts, truncated } = splitScriptWithMeta(script);
    expect(truncated).toBe(true);
    expect(parts.length).toBe(MAX_SCENES_SOFT);
  });
});
