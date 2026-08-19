import type { AnimationConfig } from "@ai-doodle/video-schema";
import { animationProgress } from "./progress";

export function fadeOpacity(
  localFrame: number,
  config: AnimationConfig,
  baseOpacity = 1,
): number {
  return baseOpacity * animationProgress(localFrame, config);
}
