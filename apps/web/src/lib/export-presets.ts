export type ExportPresetId =
  | "project"
  | "douyin"
  | "bilibili"
  | "youtube"
  | "square";

export type ExportPreset = {
  id: ExportPresetId;
  label: string;
  blurb: string;
  width: number;
  height: number;
  scale: number;
};

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "project",
    label: "当前画布",
    blurb: "按项目原始尺寸导出",
    width: 0,
    height: 0,
    scale: 1,
  },
  {
    id: "douyin",
    label: "抖音竖屏",
    blurb: "1080×1920 · 9:16",
    width: 1080,
    height: 1920,
    scale: 1,
  },
  {
    id: "bilibili",
    label: "B 站横屏",
    blurb: "1920×1080 · 16:9",
    width: 1920,
    height: 1080,
    scale: 1,
  },
  {
    id: "youtube",
    label: "YouTube",
    blurb: "1920×1080 · 16:9",
    width: 1920,
    height: 1080,
    scale: 1,
  },
  {
    id: "square",
    label: "方形短视频",
    blurb: "1080×1080 · 1:1",
    width: 1080,
    height: 1080,
    scale: 1,
  },
];

export function resolveExportSize(
  project: { width: number; height: number },
  presetId: ExportPresetId,
): { width: number; height: number; label: string } {
  const preset = EXPORT_PRESETS.find((item) => item.id === presetId);
  if (!preset || preset.id === "project") {
    return {
      width: project.width,
      height: project.height,
      label: "当前画布",
    };
  }
  return {
    width: preset.width,
    height: preset.height,
    label: preset.label,
  };
}
