import { describe, expect, it } from "vitest";
import { InvalidVideoProjectError, parseVideoProject } from "./index";

const validProject = {
  id: "demo",
  name: "Demo",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 90,
  background: { type: "paper", color: "#F6F1E7" },
  language: "zh",
  scenes: [
    {
      id: "s1",
      startFrame: 0,
      durationInFrames: 90,
      elements: [
        {
          id: "usa",
          type: "svg",
          assetId: "usa",
          x: 100,
          y: 100,
          animation: { type: "draw", durationInFrames: 60 },
        },
      ],
    },
  ],
};

describe("parseVideoProject", () => {
  it("accepts a valid project", () => {
    const project = parseVideoProject(validProject);
    expect(project.id).toBe("demo");
    expect(project.scenes).toHaveLength(1);
  });

  it("rejects empty scenes", () => {
    expect(() =>
      parseVideoProject({ ...validProject, scenes: [] }),
    ).toThrow(InvalidVideoProjectError);
  });

  it("rejects a scene that exceeds duration", () => {
    expect(() =>
      parseVideoProject({
        ...validProject,
        durationInFrames: 30,
      }),
    ).toThrow(/exceeds durationInFrames/);
  });

  it("rejects svg without assetId", () => {
    expect(() =>
      parseVideoProject({
        ...validProject,
        scenes: [
          {
            id: "s1",
            startFrame: 0,
            durationInFrames: 90,
            elements: [{ id: "x", type: "svg", x: 0, y: 0 }],
          },
        ],
      }),
    ).toThrow(/missing assetId/);
  });
});
