import type { AnimationConfig } from "@ai-doodle/video-schema";
import { applyEasing } from "./easing";

export function animationProgress(
  localFrame: number,
  config: AnimationConfig,
): number {
  const delay = config.delayInFrames ?? 0;
  const elapsed = localFrame - delay;
  if (elapsed <= 0) {
    return 0;
  }
  const raw = elapsed / config.durationInFrames;
  return applyEasing(raw, config.easing);
}
