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
        left: 48,
        right: 48,
        bottom: 64,
        textAlign: "center",
        opacity: fade,
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          maxWidth: "100%",
          padding: "12px 22px",
          borderRadius: 18,
          background: caption.style?.backgroundColor ?? "rgba(255,255,255,0.88)",
          fontSize: caption.style?.fontSize ?? 40,
          color: caption.style?.color ?? "#171717",
          fontFamily:
            caption.style?.fontFamily ??
            '"Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
          lineHeight: 1.45,
          fontWeight: 600,
          letterSpacing: "0.01em",
          boxShadow: "0 8px 24px rgba(23,23,23,0.08)",
        }}
      >
        {caption.text}
      </span>
    </div>
  );
}
