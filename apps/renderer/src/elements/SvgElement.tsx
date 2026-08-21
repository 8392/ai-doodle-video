import { getAsset } from "@ai-doodle/asset-library";
import type { Element } from "@ai-doodle/video-schema";
import { DrawSvg } from "../animations/DrawSvg";

export function SvgElement({
  element,
  drawProgress,
  reportStroke,
}: {
  element: Element;
  drawProgress: number;
  reportStroke: boolean;
}) {
  const src =
    element.src ??
    (element.assetId ? getAsset(element.assetId)?.src : undefined);
  if (!src) {
    throw new Error(`SVG element "${element.id}" is missing src or assetId`);
  }
  const width = element.width ?? 320;
  const height = element.height ?? 320;

  return (
    <DrawSvg
      src={src}
      progress={drawProgress}
      width={width}
      height={height}
      reportStroke={reportStroke}
      offsetX={element.x}
      offsetY={element.y}
    />
  );
}
