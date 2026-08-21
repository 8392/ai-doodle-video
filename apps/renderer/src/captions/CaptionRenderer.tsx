import type { Caption } from "@ai-doodle/video-schema";
import { interpolate, useCurrentFrame } from "remotion";

/** Fixed display size; long copy is paged line-by-line instead of shrinking. */
export const DEFAULT_CAPTION_FONT_SIZE = 40;
/** Approx. one subtitle line for 9:16 at the default font size. */
export const CHARS_PER_CAPTION_LINE = 16;

export function splitCaptionLines(
  text: string,
  maxCharsPerLine = CHARS_PER_CAPTION_LINE,
): string[] {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [];
  }

  const chars = [...normalized];
  if (chars.length <= maxCharsPerLine) {
    return [normalized];
  }

  const lines: string[] = [];
  let cursor = 0;
  while (cursor < chars.length) {
    if (chars.length - cursor <= maxCharsPerLine) {
      const rest = chars.slice(cursor).join("").trim();
      if (rest) {
        lines.push(rest);
      }
      break;
    }

    let end = cursor + maxCharsPerLine;
    const softStart = cursor + Math.floor(maxCharsPerLine * 0.55);
    for (let i = end - 1; i >= softStart; i -= 1) {
      const ch = chars[i];
      if (ch && /[，,、。！？!?；;\s]/.test(ch)) {
        end = i + 1;
        break;
      }
    }
    const line = chars.slice(cursor, end).join("").trim();
    if (line) {
      lines.push(line);
    }
    cursor = end;
  }
  return lines.length > 0 ? lines : [normalized];
}

export function captionLineIndex(
  frame: number,
  startFrame: number,
  endFrame: number,
  lineCount: number,
): number {
  if (lineCount <= 1) {
    return 0;
  }
  const duration = Math.max(1, endFrame - startFrame);
  const local = Math.min(duration - 1, Math.max(0, frame - startFrame));
  const index = Math.floor((local / duration) * lineCount);
  return Math.min(lineCount - 1, Math.max(0, index));
}

export function CaptionRenderer({ captions }: { captions: Caption[] }) {
  const frame = useCurrentFrame();
  const caption = captions.find(
    (item) => frame >= item.startFrame && frame < item.endFrame,
  );

  if (!caption) {
    return null;
  }

  const lines = splitCaptionLines(caption.text);
  const lineIndex = captionLineIndex(
    frame,
    caption.startFrame,
    caption.endFrame,
    lines.length,
  );
  const displayText = lines[lineIndex] ?? caption.text;
  const fontSize =
    typeof caption.style?.fontSize === "number" && caption.style.fontSize > 0
      ? caption.style.fontSize
      : DEFAULT_CAPTION_FONT_SIZE;

  const duration = Math.max(1, caption.endFrame - caption.startFrame);
  const framesPerLine = duration / Math.max(1, lines.length);
  const lineStart = caption.startFrame + lineIndex * framesPerLine;
  const lineEnd = caption.startFrame + (lineIndex + 1) * framesPerLine;

  const fade = interpolate(
    frame,
    [
      Math.max(caption.startFrame, lineStart),
      Math.max(caption.startFrame, lineStart) + Math.min(4, framesPerLine / 3),
      Math.min(caption.endFrame, lineEnd) - Math.min(4, framesPerLine / 3),
      Math.min(caption.endFrame, lineEnd),
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        bottom: 88,
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
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          padding: "12px 22px",
          borderRadius: 18,
          background: caption.style?.backgroundColor ?? "rgba(255,255,255,0.88)",
          fontSize,
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
        {displayText}
      </span>
    </div>
  );
}
