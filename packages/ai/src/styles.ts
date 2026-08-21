import {
  expandCaptionsBySentence,
  type CaptionStyle,
  type ProjectDrawing,
  type ProjectStyle,
  type VideoProject,
} from "@ai-doodle/video-schema";

export type StylePreset = {
  id: ProjectStyle;
  label: string;
  background: string;
  caption: CaptionStyle;
};

export const STYLE_PRESETS: Record<ProjectStyle, StylePreset> = {
  whiteboard: {
    id: "whiteboard",
    label: "白板手绘",
    background: "#E7E7E7",
    caption: {
      color: "#171717",
      backgroundColor: "rgba(255,255,255,0.88)",
      fontFamily: '"Microsoft YaHei", "Noto Sans SC", sans-serif',
    },
  },
  blackboard: {
    id: "blackboard",
    label: "黑板粉笔",
    background: "#1F2933",
    caption: {
      color: "#F5F0E6",
      backgroundColor: "rgba(15,23,32,0.82)",
      fontFamily: '"Microsoft YaHei", "Noto Sans SC", sans-serif',
    },
  },
  line: {
    id: "line",
    label: "简约线稿",
    background: "#FAFAF8",
    caption: {
      color: "#111111",
      backgroundColor: "rgba(255,255,255,0.72)",
      fontFamily: '"Segoe UI", "Noto Sans SC", sans-serif',
    },
  },
};

export const STYLE_OPTIONS: Array<[ProjectStyle, string]> = (
  Object.values(STYLE_PRESETS) as StylePreset[]
).map((preset) => [preset.id, preset.label]);

export function resolveProjectStyle(style: string | undefined): ProjectStyle {
  if (style === "blackboard" || style === "line" || style === "whiteboard") {
    return style;
  }
  return "whiteboard";
}

export function defaultDrawingForStyle(style: ProjectStyle): ProjectDrawing {
  if (style === "line") {
    return { handEnabled: true, defaultAnimation: "fade" };
  }
  if (style === "blackboard") {
    return { handEnabled: true, defaultAnimation: "draw" };
  }
  return { handEnabled: true, defaultAnimation: "draw" };
}

export function applyProjectStyle(
  project: VideoProject,
  style: string | undefined,
): VideoProject {
  const resolved = resolveProjectStyle(style);
  const preset = STYLE_PRESETS[resolved];
  const drawing = project.drawing ?? defaultDrawingForStyle(resolved);
  const captioned = expandCaptionsBySentence({
    ...project,
    style: resolved,
    drawing,
    background: { type: "paper", color: preset.background },
  });
  return {
    ...captioned,
    captions: captioned.captions?.map((caption) => ({
      ...caption,
      style: { ...preset.caption, ...caption.style },
    })),
  };
}
