import { getAssetOrThrow } from "@ai-doodle/asset-library";
import type { Element } from "@ai-doodle/video-schema";
import { Img } from "remotion";
import { toStaticSrc } from "../lib/to-static-src";

export function HandElement({ element }: { element: Element }) {
  const asset = getAssetOrThrow(element.assetId ?? "hand-right");
  return (
    <Img
      src={toStaticSrc(asset.src)}
      style={{
        width: element.width ?? 240,
        height: element.height ?? 240,
        objectFit: "contain",
      }}
    />
  );
}
