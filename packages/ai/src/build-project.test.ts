import { parseVideoProject } from "@ai-doodle/video-schema";
import { describe, expect, it } from "vitest";
import { EmptyScriptError, generateVideoProject } from "./build-project";

const demoScript = "为什么美国长期制裁伊朗？";

describe("generateVideoProject", () => {
  it("parses, aligns captions with scenes, and times the timeline", () => {
    const project = generateVideoProject({
      script: demoScript,
      language: "zh",
      voice: "female",
      aspect: "9:16",
      style: "whiteboard",
    });

    expect(() => parseVideoProject(project)).not.toThrow();
    expect(project.scenes.length).toBe(project.captions?.length);
    expect(project.scenes.length).toBeGreaterThanOrEqual(3);
    expect(project.durationInFrames).toBe(
      project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0),
    );
    expect(project.width).toBe(1080);
    expect(project.height).toBe(1920);
    expect(project.narration?.src).toBe("/audio/demo.wav");

    const assetIds = project.scenes.flatMap((scene) =>
      scene.elements.map((element) => element.assetId),
    );
    expect(assetIds).toContain("usa");
    expect(assetIds).toContain("sanctions");
    expect(assetIds).not.toContain("hand-left");
    expect(assetIds).not.toContain("hand-right");
  });

  it("gives unmatched sentences different icons instead of repeating globe", () => {
    const project = generateVideoProject({
      script: "第一句。第二句。第三句。",
      language: "zh",
      voice: "female",
      aspect: "9:16",
      style: "whiteboard",
    });
    const leadIcons = project.scenes.map((scene) => scene.elements[0]?.assetId);
    expect(new Set(leadIcons).size).toBe(leadIcons.length);
  });

  it("uses 16:9 canvas size", () => {
    const project = generateVideoProject({
      script: "第一句。第二句。第三句。",
      language: "en",
      voice: "male",
      aspect: "16:9",
      style: "whiteboard",
    });
    expect(project.width).toBe(1920);
    expect(project.height).toBe(1080);
    expect(project.id.startsWith("proj-")).toBe(true);
  });

  it("uses 1:1 canvas size", () => {
    const project = generateVideoProject({
      script: "第一句。第二句。第三句。",
      language: "zh",
      voice: "female",
      aspect: "1:1",
      style: "whiteboard",
    });
    expect(project.width).toBe(1080);
    expect(project.height).toBe(1080);
  });

  it("rejects empty copy", () => {
    expect(() =>
      generateVideoProject({
        script: "  ",
        language: "zh",
        voice: "female",
        aspect: "9:16",
        style: "whiteboard",
      }),
    ).toThrow(EmptyScriptError);
  });

  it("creates more than six scenes for a long script", () => {
    const script = [
      "美国希望通过展示强大的军事力量让伊朗意识到继续发展核能力攻击盟友将付出巨大代价",
      "不过军事打击也存在巨大风险可能造成地区战争扩大油价上涨以及美国自身人员伤亡问题",
      "因此美国打伊朗并不能简单理解为只是为了石油资源或者只是为了解决核武器问题本身",
      "核问题以色列安全地区霸权竞争伊朗代理人武装霍尔木兹海峡以及美国全球战略利益共同构成原因",
    ].join("。");
    const project = generateVideoProject({
      script,
      language: "zh",
      voice: "female",
      aspect: "9:16",
      style: "whiteboard",
    });
    expect(project.scenes.length).toBeGreaterThan(6);
    expect(project.scenes.length).toBe(project.captions?.length);
  });
});
