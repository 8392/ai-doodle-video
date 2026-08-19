import type { AnimationConfig } from "@ai-doodle/video-schema";
import { animationProgress } from "./progress";

export function popScale(
  localFrame: number,
  config: AnimationConfig,
  baseScale = 1,
): number {
  const t = animationProgress(localFrame, config);
  const overshoot = t < 0.7 ? t / 0.7 : 1 + (1 - t) * 0.12;
  return baseScale * Math.min(overshoot, 1.08);
}

export function popOpacity(
  localFrame: number,
  config: AnimationConfig,
): number {
  const t = animationProgress(localFrame, config);
  return Math.min(1, t * 1.4);
}
