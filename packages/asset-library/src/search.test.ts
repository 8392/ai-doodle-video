import { describe, expect, it } from "vitest";
import { getAssetOrThrow } from "./registry";
import { searchAssets } from "./search";

describe("searchAssets", () => {
  it("returns the full catalog for an empty query", () => {
    expect(searchAssets("").length).toBeGreaterThan(300);
  });

  it("finds USA by Chinese name", () => {
    const results = searchAssets("美国");
    expect(results.some((asset) => asset.id === "usa")).toBe(true);
  });

  it("finds oil related assets", () => {
    const results = searchAssets("石油");
    const ids = results.map((asset) => asset.id);
    expect(ids).toContain("oil");
    expect(ids).toContain("oil-factory");
    expect(ids).toContain("pipeline");
  });

  it("indexes newly added explainer assets", () => {
    expect(searchAssets("地球").some((asset) => asset.id === "globe")).toBe(true);
    expect(searchAssets("制裁").some((asset) => asset.id === "sanctions")).toBe(true);
    expect(searchAssets("油轮").some((asset) => asset.id === "tanker")).toBe(true);
  });

  it("indexes the editorial pack", () => {
    expect(searchAssets("法国").some((asset) => asset.id === "france")).toBe(true);
    expect(searchAssets("坦克").some((asset) => asset.id === "tank")).toBe(true);
    expect(searchAssets("芯片").some((asset) => asset.id === "chip")).toBe(true);
    expect(searchAssets("金字塔").some((asset) => asset.id === "pyramid")).toBe(true);
  });
});

describe("getAssetOrThrow", () => {
  it("throws for missing assets", () => {
    expect(() => getAssetOrThrow("does-not-exist")).toThrow(/Asset not found/);
  });
});
