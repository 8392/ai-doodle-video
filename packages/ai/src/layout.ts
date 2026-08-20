import type { AssetDefinition } from "@ai-doodle/asset-library";
import type { Element } from "@ai-doodle/video-schema";

type CanvasSize = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

export function layoutElements(
  assets: AssetDefinition[],
  canvas: CanvasSize,
  idPrefix: string,
): Element[] {
  const count = Math.min(3, assets.length);
  if (count === 0) {
    return [];
  }
  const widthRatio = count === 1 ? 0.42 : 0.32;
  const width = Math.round(canvas.width * widthRatio);
  const height = Math.round(width * 0.82);
  const portrait = canvas.height >= canvas.width;
  const positions = positionsFor(count, canvas, width, portrait);

  return assets.slice(0, count).map((asset, index) => {
    const point = positions[index] ?? { x: 0, y: 0 };
    return {
      id: `${idPrefix}-${asset.id}-${index}`,
      type: "svg" as const,
      assetId: asset.id,
      x: point.x,
      y: point.y,
      width,
      height,
      zIndex: index + 1,
      animation: {
        type: "draw" as const,
        durationInFrames: 48,
        easing: "linear",
      },
    };
  });
}

function positionsFor(
  count: number,
  canvas: CanvasSize,
  width: number,
  portrait: boolean,
): Point[] {
  const midY = Math.round(canvas.height * 0.28);
  if (count === 1) {
    return [
      {
        x: Math.round((canvas.width - width) / 2),
        y: midY,
      },
    ];
  }
  if (count === 2) {
    const gap = Math.round(canvas.width * 0.08);
    return [
      { x: gap, y: midY },
      { x: canvas.width - gap - width, y: midY },
    ];
  }
  if (portrait) {
    const topY = Math.round(canvas.height * 0.18);
    const bottomY = Math.round(canvas.height * 0.52);
    const gap = Math.round(canvas.width * 0.08);
    return [
      { x: Math.round((canvas.width - width) / 2), y: topY },
      { x: gap, y: bottomY },
      { x: canvas.width - gap - width, y: bottomY },
    ];
  }
  const gap = Math.round((canvas.width - width * 3) / 4);
  return [
    { x: gap, y: midY },
    { x: gap * 2 + width, y: midY },
    { x: gap * 3 + width * 2, y: midY },
  ];
}
