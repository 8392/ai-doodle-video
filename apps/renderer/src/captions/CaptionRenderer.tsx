import type { Caption } from "@ai-doodle/video-schema";
import { interpolate, useCurrentFrame } from "remotion";

export function CaptionRenderer({ captions }: { captions: Caption[] }) {
  const frame = useCurrentFrame();
  const caption = captions.find(
    (item) => frame >= item.startFrame && frame < item.endFrame,
  );

  if (!caption) {
    return null;
  }

  const fade = interpolate(
    frame,
    [caption.startFrame, caption.startFrame + 6, caption.endFrame - 6, caption.endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        bottom: 72,
        textAlign: "center",
        opacity: fade,
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: caption.style?.fontSize ?? 44,
          color: caption.style?.color ?? "#ffffff",
          fontFamily:
            caption.style?.fontFamily ??
            '"Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
          lineHeight: 1.25,
          fontWeight: 800,
          letterSpacing: "0.02em",
          WebkitTextStroke: "7px #111111",
          paintOrder: "stroke fill",
          textShadow: "0 2px 0 #111",
        }}
      >
        {caption.text}
      </span>
    </div>
  );
}
