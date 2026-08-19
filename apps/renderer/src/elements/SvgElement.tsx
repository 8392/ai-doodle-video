import { getAssetOrThrow } from "@ai-doodle/asset-library";
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
  if (!element.assetId) {
    throw new Error(`SVG element "${element.id}" is missing assetId`);
  }
  const asset = getAssetOrThrow(element.assetId);
  const width = element.width ?? 320;
  const height = element.height ?? 320;

  return (
    <DrawSvg
      src={asset.src}
      progress={drawProgress}
      width={width}
      height={height}
      reportStroke={reportStroke}
      offsetX={element.x}
      offsetY={element.y}
    />
  );
}
