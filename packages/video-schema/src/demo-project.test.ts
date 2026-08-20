import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseVideoProject } from "./index";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("demo-project.json", () => {
  it("matches VideoProject schema", () => {
    const file = path.join(
      here,
      "../../asset-library/demos/demo-project.json",
    );
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const project = parseVideoProject(raw);
    expect(project.scenes).toHaveLength(5);
    expect(project.captions?.length).toBe(5);
    expect(project.defaultTransition?.type).toBe("fade");
    expect(project.scenes[2]?.transition?.type).toBe("slide-up");
  });
});
