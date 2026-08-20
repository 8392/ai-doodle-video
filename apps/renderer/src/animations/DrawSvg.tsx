import { computeDrawSequence } from "@ai-doodle/animation-engine";
import { useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { hiddenPoint, useStrokePoint, type StrokePoint } from "../hand/StrokeContext";
import { useSvgDocument } from "./use-svg-paths";

type DrawSvgProps = {
  src: string;
  progress: number;
  width: number;
  height: number;
  reportStroke: boolean;
  offsetX: number;
  offsetY: number;
};

function mapPoint(
  svg: SVGSVGElement,
  width: number,
  height: number,
  x: number,
  y: number,
): { x: number; y: number } {
  const raw = svg.viewBox.baseVal;
  const vbWidth = raw.width || width;
  const vbHeight = raw.height || height;
  return {
    x: ((x - raw.x) / vbWidth) * width,
    y: ((y - raw.y) / vbHeight) * height,
  };
}

export function DrawSvg({
  src,
  progress,
  width,
  height,
  reportStroke,
  offsetX,
  offsetY,
}: DrawSvgProps) {
  const loaded = useSvgDocument(src);
  const svgRef = useRef<SVGSVGElement>(null);
  const [lengths, setLengths] = useState<number[]>([]);
  const [measureHandle] = useState(() => delayRender(`measure-svg:${src}`));
  const { setPoint } = useStrokePoint();

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !loaded) {
      return;
    }
    const nodes = [...svg.querySelectorAll("path")];
    setLengths(nodes.map((node) => node.getTotalLength()));
    continueRender(measureHandle);
  }, [loaded, measureHandle]);

  useLayoutEffect(() => {
    if (!reportStroke) {
      return;
    }
    const svg = svgRef.current;
    if (!svg || lengths.length === 0 || progress >= 1) {
      setPoint(hiddenPoint);
      return;
    }

    const sequence = computeDrawSequence(progress, lengths);
    const activeIndex = Math.max(0, sequence.activePathIndex);
    const pathNode = svg.querySelectorAll("path")[activeIndex];
    const length = lengths[activeIndex] ?? 0;
    const pathProgress = sequence.pathProgress[activeIndex] ?? 0;
    if (!pathNode || length <= 0) {
      setPoint(hiddenPoint);
      return;
    }

    const offset = Math.min(length, Math.max(0, pathProgress * length));
    const current = pathNode.getPointAtLength(offset);
    const mapped = mapPoint(svg, width, height, current.x, current.y);
    const point: StrokePoint = {
      x: offsetX + mapped.x,
      y: offsetY + mapped.y,
      angle: 0,
      visible: true,
    };
    setPoint(point);
  }, [lengths, offsetX, offsetY, progress, reportStroke, setPoint, width, height]);

  useLayoutEffect(() => {
    return () => {
      if (reportStroke) {
        setPoint(hiddenPoint);
      }
    };
  }, [reportStroke, setPoint]);

  if (!loaded) {
    return null;
  }

  const sequence = computeDrawSequence(progress, lengths);
  const measured = lengths.length === loaded.paths.length;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={loaded.viewBox}
      style={{ overflow: "visible", display: "block" }}
    >
      {loaded.paths.map((path, index) => {
        const length = lengths[index] ?? 0;
        const drawn = sequence.pathProgress[index] ?? 0;
        const pathProgress = measured
          ? reportStroke && index === Math.max(0, sequence.activePathIndex)
            ? Math.max(drawn, 0.02)
            : drawn
          : 0;
        const dashOffset = measured ? length * (1 - pathProgress) : 1;
        const fillOpacity =
          path.fill === "none" ? 0 : pathProgress >= 1 ? 1 : Math.max(0, (pathProgress - 0.72) / 0.28);
        return (
          <path
            key={`${index}-${path.d.slice(0, 24)}`}
            d={path.d}
            fill={path.fill === "none" ? "none" : path.fill}
            fillOpacity={fillOpacity}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={measured && length > 0 ? length : 1}
            strokeDashoffset={dashOffset}
          />
        );
      })}
    </svg>
  );
}
