import type { AssetDefinition } from "@ai-doodle/asset-library";
import type {
  AnimationType,
  Element,
  SceneLayout,
} from "@ai-doodle/video-schema";

type CanvasSize = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

export type LayoutOptions = {
  narration?: string;
  defaultAnimation?: AnimationType;
};

export function inferLayout(
  narration: string,
  assetCount: number,
): SceneLayout {
  const text = narration.toLowerCase();
  if (/什么是|定义为|定义是|的定义|meaning of|what is/.test(text)) {
    return "define";
  }
  if (/因此|所以|导致|因为|因果|从而|加速|结果|cause|because|therefore/.test(text)) {
    return "cause";
  }
  if (/地图|全球|世界|地球|国家|疆域|map|globe|world/.test(text)) {
    return "map";
  }
  if (/对比|对决|两边|versus|\bvs\b|一边/.test(text) || assetCount === 2) {
    return "compare";
  }
  if (
    /然后|首先|接着|随后|流程|步骤|先后|first|then|finally/.test(text) ||
    assetCount >= 3
  ) {
    return "flow";
  }
  return "focus";
}

export function layoutElements(
  assets: AssetDefinition[],
  canvas: CanvasSize,
  idPrefix: string,
  layout: SceneLayout = "focus",
  options: LayoutOptions = {},
): Element[] {
  const picked = assets.slice(0, 3);
  if (picked.length === 0) {
    return [];
  }
  const kind =
    layout === "define" || layout === "cause"
      ? layout
      : picked.length === 1
        ? "focus"
        : layout;
  const portrait = canvas.height >= canvas.width;
  const defaultAnimation = options.defaultAnimation ?? "draw";
  const widthRatio =
    kind === "focus" || kind === "define"
      ? 0.42
      : kind === "map"
        ? 0.38
        : 0.28;
  const width = Math.round(canvas.width * widthRatio);
  const height = Math.round(width * 0.82);
  const positions = positionsFor(kind, picked.length, canvas, width, portrait);

  const elements: Element[] = picked.map((asset, index) => {
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
        type: defaultAnimation,
        durationInFrames:
          defaultAnimation === "draw"
            ? kind === "flow" || kind === "cause"
              ? 36
              : 48
            : 18,
        delayInFrames:
          kind === "flow" || kind === "cause" ? index * 10 : 0,
        easing: defaultAnimation === "draw" ? "linear" : "ease-out",
      },
    };
  });

  if (kind === "define") {
    const title = shortLabel(options.narration ?? picked[0]?.name ?? "");
    elements.push({
      id: `${idPrefix}-define-title`,
      type: "text",
      text: title,
      x: Math.round(canvas.width * 0.12),
      y: Math.round(canvas.height * (portrait ? 0.62 : 0.68)),
      width: Math.round(canvas.width * 0.76),
      height: Math.round(canvas.height * 0.12),
      zIndex: 6,
      animation: {
        type: defaultAnimation === "draw" ? "fade" : defaultAnimation,
        durationInFrames: 16,
        delayInFrames: 12,
      },
    });
  }

  if ((kind === "flow" || kind === "cause") && picked.length >= 2) {
    for (let index = 0; index < picked.length - 1; index += 1) {
      const from = positions[index];
      const to = positions[index + 1];
      if (!from || !to) {
        continue;
      }
      const arrowWidth = Math.max(72, Math.round(Math.abs(to.x - from.x) * 0.45));
      elements.push({
        id: `${idPrefix}-arrow-${index}`,
        type: "arrow",
        x: Math.round(from.x + width - 12),
        y: Math.round(from.y + height * 0.35),
        width: arrowWidth,
        height: 64,
        zIndex: 8,
        animation: {
          type: "fade",
          durationInFrames: 16,
          delayInFrames: 18 + index * 10,
        },
      });
    }
  }

  if (kind === "cause" && options.narration) {
    elements.push({
      id: `${idPrefix}-cause-caption`,
      type: "text",
      text: shortLabel(options.narration),
      x: Math.round(canvas.width * 0.1),
      y: Math.round(canvas.height * (portrait ? 0.72 : 0.78)),
      width: Math.round(canvas.width * 0.8),
      height: Math.round(canvas.height * 0.1),
      zIndex: 7,
      animation: { type: "fade", durationInFrames: 14, delayInFrames: 20 },
    });
  }

  return elements;
}

function shortLabel(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 28) {
    return trimmed;
  }
  return `${trimmed.slice(0, 28)}…`;
}

function positionsFor(
  layout: SceneLayout,
  count: number,
  canvas: CanvasSize,
  width: number,
  portrait: boolean,
): Point[] {
  if (layout === "focus" || layout === "define" || count === 1) {
    return [
      {
        x: Math.round((canvas.width - width) / 2),
        y: Math.round(canvas.height * (portrait ? 0.22 : 0.18)),
      },
    ];
  }
  if (layout === "compare") {
    const gap = Math.round(canvas.width * 0.08);
    const y = Math.round(canvas.height * 0.28);
    return [
      { x: gap, y },
      { x: canvas.width - gap - width, y },
    ].slice(0, count);
  }
  if (layout === "map") {
    const y = Math.round(canvas.height * 0.2);
    if (count === 2) {
      return [
        { x: Math.round(canvas.width * 0.08), y },
        { x: Math.round(canvas.width * 0.54), y },
      ];
    }
    const gap = Math.round((canvas.width - width * count) / (count + 1));
    return Array.from({ length: count }, (_, index) => ({
      x: gap * (index + 1) + width * index,
      y,
    }));
  }
  if (portrait && count === 3) {
    const topY = Math.round(canvas.height * 0.16);
    const bottomY = Math.round(canvas.height * 0.5);
    const gap = Math.round(canvas.width * 0.08);
    return [
      { x: Math.round((canvas.width - width) / 2), y: topY },
      { x: gap, y: bottomY },
      { x: canvas.width - gap - width, y: bottomY },
    ];
  }
  const gap = Math.round((canvas.width - width * count) / (count + 1));
  const y = Math.round(canvas.height * 0.28);
  return Array.from({ length: count }, (_, index) => ({
    x: gap * (index + 1) + width * index,
    y,
  }));
}
