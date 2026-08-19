import { useCallback, useLayoutEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { toStaticSrc } from "../lib/to-static-src";

export type SvgPathData = {
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export type LoadedSvg = {
  paths: SvgPathData[];
  viewBox: string;
};

function attr(node: Element, name: string, fallback: string): string {
  let current: Element | null = node;
  while (current) {
    const value = current.getAttribute(name);
    if (value && value.length > 0) {
      return value;
    }
    current = current.parentElement;
  }
  return fallback;
}

function rectPath(node: Element): string {
  const x = Number(node.getAttribute("x") ?? 0);
  const y = Number(node.getAttribute("y") ?? 0);
  const width = Number(node.getAttribute("width") ?? 0);
  const height = Number(node.getAttribute("height") ?? 0);
  const rx = Math.min(Number(node.getAttribute("rx") ?? 0), width / 2);
  const ry = Math.min(Number(node.getAttribute("ry") ?? rx), height / 2);
  if (rx <= 0 && ry <= 0) {
    return `M${x} ${y}h${width}v${height}h${-width}z`;
  }
  return `M${x + rx} ${y}h${width - rx * 2}q${rx} 0 ${rx} ${ry}v${height - ry * 2}q0 ${ry} ${-rx} ${ry}h${-(width - rx * 2)}q${-rx} 0 ${-rx} ${-ry}v${-(height - ry * 2)}q0 ${-ry} ${rx} ${-ry}z`;
}

function circlePath(node: Element): string {
  const cx = Number(node.getAttribute("cx") ?? 0);
  const cy = Number(node.getAttribute("cy") ?? 0);
  const r = Number(node.getAttribute("r") ?? 0);
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function ellipsePath(node: Element): string {
  const cx = Number(node.getAttribute("cx") ?? 0);
  const cy = Number(node.getAttribute("cy") ?? 0);
  const rx = Number(node.getAttribute("rx") ?? 0);
  const ry = Number(node.getAttribute("ry") ?? 0);
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
}

function polygonPath(node: Element): string {
  const points = node.getAttribute("points") ?? "";
  return `M${points.trim().replaceAll(" ", " L")} Z`;
}

function toPathData(node: Element): string | null {
  switch (node.tagName.toLowerCase()) {
    case "path":
      return node.getAttribute("d");
    case "rect":
      return rectPath(node);
    case "circle":
      return circlePath(node);
    case "ellipse":
      return ellipsePath(node);
    case "polygon":
      return polygonPath(node);
    case "polyline":
      return `M${(node.getAttribute("points") ?? "").trim().replaceAll(" ", " L")}`;
    default:
      return null;
  }
}

export function useSvgDocument(src: string): LoadedSvg | null {
  const [data, setData] = useState<LoadedSvg | null>(null);
  const [handle] = useState(() => delayRender(`load-svg:${src}`));

  const load = useCallback(async () => {
    try {
      const response = await fetch(toStaticSrc(src));
      if (!response.ok) {
        throw new Error(`Failed to load SVG ${src}: HTTP ${response.status}`);
      }
      const text = await response.text();
      const documentNode = new DOMParser().parseFromString(text, "image/svg+xml");
      if (documentNode.querySelector("parsererror")) {
        throw new Error(`Invalid SVG markup: ${src}`);
      }
      const root = documentNode.documentElement;
      const nodes = [
        ...documentNode.querySelectorAll("path, rect, circle, ellipse, polygon, polyline"),
      ];
      if (nodes.length === 0) {
        throw new Error(`SVG has no drawable elements: ${src}`);
      }
      const width = root.getAttribute("width") ?? "240";
      const height = root.getAttribute("height") ?? "240";
      const viewBox = root.getAttribute("viewBox") ?? `0 0 ${width} ${height}`;
      setData({
        viewBox,
        paths: nodes.flatMap((node) => {
          const d = toPathData(node);
          if (!d) {
            return [];
          }
          return [
            {
              d,
              fill: attr(node, "fill", "none"),
              stroke: attr(node, "stroke", "#171717"),
              strokeWidth: Number(attr(node, "stroke-width", "4")),
            },
          ];
        }),
      });
      continueRender(handle);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [handle, src]);

  useLayoutEffect(() => {
    void load();
  }, [load]);

  return data;
}
