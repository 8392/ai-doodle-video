import { getAsset } from "@ai-doodle/asset-library";
import type { Element } from "@ai-doodle/video-schema";
import { Img } from "remotion";
import { toStaticSrc } from "../lib/to-static-src";

export function ImageElement({ element }: { element: Element }) {
  const src = element.src ?? (element.assetId ? getAsset(element.assetId)?.src : undefined);
  if (!src) {
    throw new Error(`Image element "${element.id}" is missing src`);
  }
  return (
    <Img
      src={src.startsWith("data:") ? src : toStaticSrc(src)}
      style={{
        width: element.width ?? 320,
        height: element.height ?? 320,
        objectFit: "contain",
      }}
    />
  );
}
