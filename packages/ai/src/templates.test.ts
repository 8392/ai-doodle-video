import { describe, expect, it } from "vitest";
import { findScriptTemplate, SCRIPT_TEMPLATES } from "./templates";

describe("script templates", () => {
  it("includes the four planned categories", () => {
    expect(SCRIPT_TEMPLATES.map((item) => item.id)).toEqual([
      "science",
      "finance",
      "product",
      "tutorial",
    ]);
  });

  it("finds a template by id", () => {
    expect(findScriptTemplate("finance")?.label).toBe("财经");
    expect(findScriptTemplate("missing")).toBeUndefined();
  });
});
