import type { Element } from "@ai-doodle/video-schema";

export function TextElement({ element }: { element: Element }) {
  return (
    <div
      style={{
        width: element.width,
        fontSize: 36,
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
        color: "#171717",
        lineHeight: 1.3,
        whiteSpace: "pre-wrap",
      }}
    >
      {element.text ?? ""}
    </div>
  );
}
