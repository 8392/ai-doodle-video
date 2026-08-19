import type { AnimationConfig } from "@ai-doodle/video-schema";
import { animationProgress } from "./progress";

export type SlideOffset = {
  x: number;
  y: number;
};

const DISTANCE = 80;

export function slideOffset(
  localFrame: number,
  config: AnimationConfig,
): SlideOffset {
  const t = animationProgress(localFrame, config);
  const remaining = 1 - t;

  switch (config.type) {
    case "slide-left":
      return { x: -DISTANCE * remaining, y: 0 };
    case "slide-right":
      return { x: DISTANCE * remaining, y: 0 };
    case "slide-up":
      return { x: 0, y: -DISTANCE * remaining };
    case "slide-down":
      return { x: 0, y: DISTANCE * remaining };
    default:
      return { x: 0, y: 0 };
  }
}
