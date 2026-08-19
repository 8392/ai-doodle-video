export type EasingName = "linear" | "ease-in" | "ease-out" | "ease-in-out";

function clamp01(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

export function applyEasing(t: number, easing: string = "ease-in-out"): number {
  const progress = clamp01(t);
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
    default: {
      if (progress < 0.5) {
        return 2 * progress * progress;
      }
      return 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }
  }
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
