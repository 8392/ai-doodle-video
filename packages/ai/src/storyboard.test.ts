import { describe, expect, it } from "vitest";
import { generateVideoProject } from "./build-project";
import { inferLayout, layoutElements } from "./layout";
import {
  assembleVideoProject,
  extractJsonObject,
  parseStoryboardPlan,
} from "./storyboard";
import { applyProjectStyle } from "./styles";

describe("storyboard assemble", () => {
  it("parses fenced JSON and builds a valid project", () => {
    const parsed = parseStoryboardPlan(
      extractJsonObject(`
\`\`\`json
{"name":"制裁","scenes":[{"narration":"美国制裁伊朗","assetIds":["usa","iran"],"layout":"compare"}]}
\`\`\`
`),
    );
    const project = assembleVideoProject(parsed, {
      script: "美国制裁伊朗。还涉及石油。第三句补充。",
      language: "zh",
      voice: "zh-CN-XiaoxiaoNeural",
      aspect: "16:9",
      style: "blackboard",
    });
    expect(project.style).toBe("blackboard");
    expect(project.background.color).toBe("#1F2933");
    expect(project.scenes[0]?.layout).toBe("compare");
    expect(project.scenes[0]?.elements.some((element) => element.assetId === "usa")).toBe(
      true,
    );
  });
});

describe("layout", () => {
  it("infers compare/flow/map/focus", () => {
    expect(inferLayout("两边对比", 2)).toBe("compare");
    expect(inferLayout("首先然后接着", 3)).toBe("flow");
    expect(inferLayout("世界地图", 1)).toBe("map");
    expect(inferLayout("一个概念", 1)).toBe("focus");
  });

  it("adds arrows for flow layouts", () => {
    const elements = layoutElements(
      [
        {
          id: "usa",
          name: "美国",
          category: "country",
          tags: [],
          src: "/x.svg",
          type: "svg",
        },
        {
          id: "iran",
          name: "伊朗",
          category: "country",
          tags: [],
          src: "/y.svg",
          type: "svg",
        },
      ],
      { width: 1920, height: 1080 },
      "el",
      "flow",
    );
    expect(elements.some((element) => element.type === "arrow")).toBe(true);
  });
});

describe("styles", () => {
  it("applies blackboard captions", () => {
    const project = generateVideoProject({
      script: "第一句。第二句。第三句。",
      language: "zh",
      voice: "female",
      aspect: "9:16",
      style: "blackboard",
    });
    const styled = applyProjectStyle(project, "blackboard");
    expect(styled.captions?.[0]?.style?.color).toBe("#F5F0E6");
  });
});
