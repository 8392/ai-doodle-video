import { describe, expect, it } from "vitest";
import { computeDrawSequence } from "./draw";

describe("computeDrawSequence", () => {
  it("draws paths one after another by length", () => {
    const mid = computeDrawSequence(0.5, [100, 100]);
    expect(mid.pathProgress[0]).toBe(1);
    expect(mid.pathProgress[1]).toBe(0);
    expect(mid.activePathIndex).toBe(0);

    const later = computeDrawSequence(0.75, [100, 100]);
    expect(later.pathProgress[0]).toBe(1);
    expect(later.pathProgress[1]).toBe(0.5);
    expect(later.activePathIndex).toBe(1);
  });

  it("weights longer paths more", () => {
    const result = computeDrawSequence(0.5, [10, 90]);
    expect(result.pathProgress[0]).toBe(1);
    expect(result.pathProgress[1]).toBeCloseTo(40 / 90);
  });

  it("returns empty sequence for no paths", () => {
    const result = computeDrawSequence(1, []);
    expect(result.pathProgress).toEqual([]);
    expect(result.activePathIndex).toBe(-1);
  });
});
