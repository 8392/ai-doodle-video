import type { Element } from "@ai-doodle/video-schema";

export function ArrowElement({ element }: { element: Element }) {
  const width = element.width ?? 220;
  const height = element.height ?? 80;
  return (
    <svg width={width} height={height} viewBox="0 0 220 80" fill="none">
      <path
        d="M16 40 L168 40"
        stroke="#171717"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M148 18 L196 40 L148 62"
        stroke="#171717"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
