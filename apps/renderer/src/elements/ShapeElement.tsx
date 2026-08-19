import type { Element } from "@ai-doodle/video-schema";

export function ShapeElement({ element }: { element: Element }) {
  const width = element.width ?? 120;
  const height = element.height ?? 120;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x="4"
        y="4"
        width={width - 8}
        height={height - 8}
        fill="none"
        stroke="#171717"
        strokeWidth="3"
        rx="12"
      />
    </svg>
  );
}
