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
    expect(project.scenes.length).toBeLessThanOrEqual(6);
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
});
