import {
  animationProgress,
  fadeOpacity,
  popOpacity,
  popScale,
  slideOffset,
} from "@ai-doodle/animation-engine";
import type { Element } from "@ai-doodle/video-schema";

export type ElementMotion = {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
  drawProgress: number;
};

export function isDrawAnimationActive(
  element: Element,
  localFrame: number,
): boolean {
  const animation = element.animation;
  if (animation?.type !== "draw") {
    return false;
  }
  const delay = animation.delayInFrames ?? 0;
  return localFrame >= delay && localFrame < delay + animation.durationInFrames;
}

export function computeElementMotion(
  element: Element,
  localFrame: number,
): ElementMotion {
  const baseOpacity = element.opacity ?? 1;
  const baseScale = element.scale ?? 1;
  const animation = element.animation;

  if (!animation) {
    return {
      opacity: baseOpacity,
      scale: baseScale,
      translateX: 0,
      translateY: 0,
      drawProgress: 1,
    };
  }

  switch (animation.type) {
    case "draw":
      return {
        opacity: baseOpacity,
        scale: baseScale,
        translateX: 0,
        translateY: 0,
        drawProgress: animationProgress(localFrame, animation),
      };
    case "fade":
      return {
        opacity: fadeOpacity(localFrame, animation, baseOpacity),
        scale: baseScale,
        translateX: 0,
        translateY: 0,
        drawProgress: 1,
      };
    case "pop":
      return {
        opacity: popOpacity(localFrame, animation) * baseOpacity,
        scale: popScale(localFrame, animation, baseScale),
        translateX: 0,
        translateY: 0,
        drawProgress: 1,
      };
    case "slide-left":
    case "slide-right":
    case "slide-up":
    case "slide-down": {
      const offset = slideOffset(localFrame, animation);
      return {
        opacity: animationProgress(localFrame, animation) * baseOpacity,
        scale: baseScale,
        translateX: offset.x,
        translateY: offset.y,
        drawProgress: 1,
      };
    }
    default: {
      const exhaustive: never = animation.type;
      throw new Error(`Unsupported animation: ${exhaustive}`);
    }
  }
}
