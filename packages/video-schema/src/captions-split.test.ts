import { describe, expect, it } from "vitest";
import { expandCaptionsBySentence } from "./captions-split";
import type { VideoProject } from "./project";

const project: VideoProject = {
  id: "c",
  name: "c",
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 90,
  background: { type: "paper", color: "#eee" },
  language: "zh",
  scenes: [
    {
      id: "s1",
      startFrame: 0,
      durationInFrames: 90,
      narration: "第一句。第二句更长一些。",
      elements: [],
    },
  ],
};

describe("expandCaptionsBySentence", () => {
  it("splits a scene into sentence-level captions", () => {
    const next = expandCaptionsBySentence(project);
    expect(next.captions).toHaveLength(2);
    expect(next.captions?.[0]?.text).toBe("第一句");
    expect(next.captions?.[1]?.text).toContain("第二句");
    expect(next.captions?.[0]?.startFrame).toBe(0);
    expect(next.captions?.[1]?.endFrame).toBe(90);
  });
});
