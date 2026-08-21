import { VideoComposition } from "@ai-doodle/renderer";
import type { VideoProject } from "@ai-doodle/video-schema";
import { renderMediaOnWeb } from "@remotion/web-renderer";

export type WebRenderProgress = {
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
};

export async function renderProjectOnWeb(
  project: VideoProject,
  options: {
    signal?: AbortSignal;
    muted?: boolean;
    width?: number;
    height?: number;
    onProgress?: (progress: WebRenderProgress) => void;
  } = {},
): Promise<Blob> {
  const totalFrames = Math.max(1, project.durationInFrames);
  const width = options.width ?? project.width;
  const height = options.height ?? project.height;
  const { getBlob } = await renderMediaOnWeb({
    composition: {
      id: project.id,
      component: VideoComposition,
      durationInFrames: project.durationInFrames,
      fps: project.fps,
      width,
      height,
      defaultProps: { project },
    },
    inputProps: { project },
    container: "mp4",
    videoCodec: "h264",
    muted: options.muted ?? false,
    signal: options.signal ?? null,
    hardwareAcceleration: "prefer-hardware",
    onProgress: ({ renderedFrames, encodedFrames }) => {
      options.onProgress?.({
        renderedFrames,
        encodedFrames,
        totalFrames,
      });
    },
  });
  return getBlob();
}
