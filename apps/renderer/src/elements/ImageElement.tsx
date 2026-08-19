import { getAssetOrThrow } from "@ai-doodle/asset-library";
import type { Element } from "@ai-doodle/video-schema";
import { Img } from "remotion";
import { toStaticSrc } from "../lib/to-static-src";

export function ImageElement({ element }: { element: Element }) {
  if (!element.assetId) {
    throw new Error(`Image element "${element.id}" is missing assetId`);
  }
  const asset = getAssetOrThrow(element.assetId);
  return (
    <Img
      src={toStaticSrc(asset.src)}
      style={{
        width: element.width ?? 320,
        height: element.height ?? 320,
        objectFit: "contain",
      }}
    />
  );
}
