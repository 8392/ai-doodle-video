import type { ResolvedCamera } from "../camera/interpolate-camera";

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: ResolvedCamera,
  width: number,
  height: number,
): { x: number; y: number } {
  const originX = width / 2;
  const originY = height / 2;
  return {
    x: (worldX - originX) * camera.scale + originX + camera.x,
    y: (worldY - originY) * camera.scale + originY + camera.y,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fitHandInFrame(options: {
  tipX: number;
  tipY: number;
  handWidth: number;
  handHeight: number;
  frameWidth: number;
  frameHeight: number;
  padding: number;
}): { left: number; top: number } {
  const maxLeft = options.frameWidth - options.handWidth - options.padding;
  const maxTop = options.frameHeight - options.handHeight - options.padding;
  return {
    left: clamp(options.tipX, options.padding, Math.max(options.padding, maxLeft)),
    top: clamp(options.tipY, options.padding, Math.max(options.padding, maxTop)),
  };
}
