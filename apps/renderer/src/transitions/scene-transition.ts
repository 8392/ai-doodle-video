import { applyEasing } from "@ai-doodle/animation-engine";
import type {
  Scene,
  TransitionConfig,
  TransitionType,
  VideoProject,
} from "@ai-doodle/video-schema";

export const DEFAULT_TRANSITION: TransitionConfig = {
  type: "fade",
  durationInFrames: 18,
  easing: "ease-in-out",
};

export function resolveSceneTransition(
  project: VideoProject,
  scene: Scene,
): TransitionConfig {
  return scene.transition ?? project.defaultTransition ?? DEFAULT_TRANSITION;
}

export function incomingTransitionProgress(
  sceneIndex: number,
  localFrame: number,
  transition: TransitionConfig,
  sceneDuration: number,
): number {
  if (sceneIndex <= 0 || transition.type === "none") {
    return 1;
  }
  const duration = Math.max(
    1,
    Math.min(transition.durationInFrames, Math.max(1, sceneDuration - 1)),
  );
  return applyEasing(localFrame / duration, transition.easing);
}

export function sceneLayerStyle(
  kind: "in" | "out",
  type: TransitionType,
  progress: number,
  width: number,
  height: number,
): {
  opacity: number;
  transform: string;
} {
  if (type === "none" || progress >= 1) {
    return { opacity: 1, transform: "translate(0px, 0px)" };
  }

  if (type === "fade") {
    return {
      opacity: kind === "in" ? progress : 1 - progress,
      transform: "translate(0px, 0px)",
    };
  }

  const axis =
    type === "slide-left" || type === "slide-right"
      ? { x: type === "slide-left" ? width : -width, y: 0 }
      : { x: 0, y: type === "slide-up" ? height : -height };

  if (kind === "in") {
    return {
      opacity: 1,
      transform: `translate(${axis.x * (1 - progress)}px, ${axis.y * (1 - progress)}px)`,
    };
  }

  return {
    opacity: 1,
    transform: `translate(${-axis.x * progress}px, ${-axis.y * progress}px)`,
  };
}
