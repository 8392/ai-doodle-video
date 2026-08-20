import type { Element, VideoProject } from "@ai-doodle/video-schema";
import { resolveCameraAtFrame } from "./project-edits";

export type DisplayRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getCompositionDisplayRect(
  containerWidth: number,
  containerHeight: number,
  compositionWidth: number,
  compositionHeight: number,
): DisplayRect {
  const containerAspect = containerWidth / containerHeight;
  const compositionAspect = compositionWidth / compositionHeight;

  if (containerAspect > compositionAspect) {
    const height = containerHeight;
    const width = height * compositionAspect;
    return {
      left: (containerWidth - width) / 2,
      top: 0,
      width,
      height,
    };
  }

  const width = containerWidth;
  const height = width / compositionAspect;
  return {
    left: 0,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function screenToCompositionPoint(options: {
  clientX: number;
  clientY: number;
  containerRect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  compositionWidth: number;
  compositionHeight: number;
  camera: { x: number; y: number; scale: number };
}): { x: number; y: number } | null {
  const display = getCompositionDisplayRect(
    options.containerRect.width,
    options.containerRect.height,
    options.compositionWidth,
    options.compositionHeight,
  );

  const localX = options.clientX - options.containerRect.left - display.left;
  const localY = options.clientY - options.containerRect.top - display.top;

  if (
    localX < 0 ||
    localY < 0 ||
    localX > display.width ||
    localY > display.height
  ) {
    return null;
  }

  const screenX = (localX / display.width) * options.compositionWidth;
  const screenY = (localY / display.height) * options.compositionHeight;

  const originX = options.compositionWidth / 2;
  const originY = options.compositionHeight / 2;
  const scale = options.camera.scale || 1;

  return {
    x: (screenX - originX - options.camera.x) / scale + originX,
    y: (screenY - originY - options.camera.y) / scale + originY,
  };
}

export function compositionToContainerPoint(options: {
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
  compositionWidth: number;
  compositionHeight: number;
  camera: { x: number; y: number; scale: number };
}): { x: number; y: number } {
  const display = getCompositionDisplayRect(
    options.containerWidth,
    options.containerHeight,
    options.compositionWidth,
    options.compositionHeight,
  );
  const originX = options.compositionWidth / 2;
  const originY = options.compositionHeight / 2;
  const scale = options.camera.scale || 1;
  const screenX = (options.x - originX) * scale + originX + options.camera.x;
  const screenY = (options.y - originY) * scale + originY + options.camera.y;
  return {
    x: display.left + (screenX / options.compositionWidth) * display.width,
    y: display.top + (screenY / options.compositionHeight) * display.height,
  };
}

export function elementWorldRect(element: Element): DisplayRect {
  const width = element.width ?? 320;
  const height = element.height ?? 320;
  const scale = element.scale ?? 1;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  return {
    left: element.x + (width - scaledWidth) / 2,
    top: element.y + (height - scaledHeight) / 2,
    width: scaledWidth,
    height: scaledHeight,
  };
}

export function pointInElement(element: Element, point: { x: number; y: number }): boolean {
  const rect = elementWorldRect(element);
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}

export function hitTestElement(
  elements: Element[],
  point: { x: number; y: number },
): Element | undefined {
  const sorted = [...elements].sort(
    (left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0),
  );
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const element = sorted[index];
    if (element && pointInElement(element, point)) {
      return element;
    }
  }
  return undefined;
}

export function elementOverlayRect(options: {
  element: Element;
  containerWidth: number;
  containerHeight: number;
  compositionWidth: number;
  compositionHeight: number;
  camera: { x: number; y: number; scale: number };
}): DisplayRect {
  const world = elementWorldRect(options.element);
  const topLeft = compositionToContainerPoint({
    x: world.left,
    y: world.top,
    containerWidth: options.containerWidth,
    containerHeight: options.containerHeight,
    compositionWidth: options.compositionWidth,
    compositionHeight: options.compositionHeight,
    camera: options.camera,
  });
  const bottomRight = compositionToContainerPoint({
    x: world.left + world.width,
    y: world.top + world.height,
    containerWidth: options.containerWidth,
    containerHeight: options.containerHeight,
    compositionWidth: options.compositionWidth,
    compositionHeight: options.compositionHeight,
    camera: options.camera,
  });
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

export function dropPointToElementOrigin(options: {
  point: { x: number; y: number };
  elementWidth: number;
  elementHeight: number;
  compositionWidth: number;
  compositionHeight: number;
}): { x: number; y: number } {
  const rawX = options.point.x - options.elementWidth / 2;
  const rawY = options.point.y - options.elementHeight / 2;
  return {
    x: Math.round(
      Math.min(
        Math.max(rawX, 0),
        options.compositionWidth - options.elementWidth,
      ),
    ),
    y: Math.round(
      Math.min(
        Math.max(rawY, 0),
        options.compositionHeight - options.elementHeight,
      ),
    ),
  };
}

export function findPreviewSurface(container: HTMLElement): DOMRect {
  const media = container.querySelector("canvas, video");
  if (media) {
    return media.getBoundingClientRect();
  }
  return container.getBoundingClientRect();
}

export function resolveDropPosition(options: {
  clientX: number;
  clientY: number;
  containerRect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  project: VideoProject;
  frame: number;
}): { x: number; y: number } | null {
  const elementWidth = Math.round(options.project.width * 0.42);
  const elementHeight = Math.round(elementWidth * 0.82);
  const camera = resolveCameraAtFrame(options.project, options.frame);
  const point = screenToCompositionPoint({
    clientX: options.clientX,
    clientY: options.clientY,
    containerRect: options.containerRect,
    compositionWidth: options.project.width,
    compositionHeight: options.project.height,
    camera,
  });
  if (!point) {
    return null;
  }
  return dropPointToElementOrigin({
    point,
    elementWidth,
    elementHeight,
    compositionWidth: options.project.width,
    compositionHeight: options.project.height,
  });
}
