import type { PlayerRef } from "@remotion/player";
import { getAsset } from "@ai-doodle/asset-library";
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import {
  elementOverlayRect,
  hitTestElement,
  screenToCompositionPoint,
} from "./preview-coords";
import { findSceneIndexAtFrame, resolveCameraAtFrame } from "./project-edits";
import { useEditorStore } from "../stores/editor-store";

type DragState = {
  elementId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export function PreviewOverlay({
  containerRef,
  playerRef,
  enabled,
  showAssets,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  playerRef: RefObject<PlayerRef | null>;
  enabled: boolean;
  showAssets: boolean;
}) {
  const project = useEditorStore((state) => state.project);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectScene = useEditorStore((state) => state.selectScene);
  const selectElement = useEditorStore((state) => state.selectElement);
  const moveElement = useEditorStore((state) => state.moveElement);
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = playerRef.current?.getCurrentFrame() ?? 0;
      setFrame((current) => (current === next ? current : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerRef]);

  if (!project || size.width === 0 || size.height === 0 || !showAssets) {
    return null;
  }

  const camera = resolveCameraAtFrame(project, frame);
  const scene = project.scenes[findSceneIndexAtFrame(project, frame)];
  const elements = scene?.elements ?? [];

  function compositionPoint(clientX: number, clientY: number) {
    const container = containerRef.current;
    if (!container || !project) {
      return null;
    }
    return screenToCompositionPoint({
      clientX,
      clientY,
      containerRect: container.getBoundingClientRect(),
      compositionWidth: project.width,
      compositionHeight: project.height,
      camera: resolveCameraAtFrame(
        project,
        playerRef.current?.getCurrentFrame() ?? frame,
      ),
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || event.button !== 0 || !scene) {
      return;
    }
    const point = compositionPoint(event.clientX, event.clientY);
    if (!point) {
      selectElement(null);
      return;
    }
    const hit = hitTestElement(elements, point);
    if (!hit) {
      selectElement(null);
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    selectScene(scene.id);
    selectElement(hit.id);
    dragRef.current = {
      elementId: hit.id,
      startX: point.x,
      startY: point.y,
      originX: hit.x,
      originY: hit.y,
    };
    playerRef.current?.pause();
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const point = compositionPoint(event.clientX, event.clientY);
    const drag = dragRef.current;
    if (!drag) {
      setHoverId(point ? hitTestElement(elements, point)?.id ?? null : null);
      return;
    }
    if (!point || !project) {
      return;
    }
    if (useEditorStore.getState().selectedElementId !== drag.elementId) {
      selectElement(drag.elementId);
    }
    moveElement(drag.elementId, {
      x: Math.round(drag.originX + point.x - drag.startX),
      y: Math.round(drag.originY + point.y - drag.startY),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <div
      className={`absolute inset-0 z-20 ${enabled ? "" : "pointer-events-none"} ${
        dragging ? "cursor-grabbing" : hoverId ? "cursor-grab" : "cursor-default"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        if (!dragRef.current) {
          setHoverId(null);
        }
      }}
      style={{ touchAction: "none" }}
    >
      {elements.map((element) => {
        const rect = elementOverlayRect({
          element,
          containerWidth: size.width,
          containerHeight: size.height,
          compositionWidth: project.width,
          compositionHeight: project.height,
          camera,
        });
        const selected = element.id === selectedElementId;
        const hovered = element.id === hoverId;
        const asset = getAsset(element.assetId ?? "");
        return (
          <div
            key={element.id}
            className={`pointer-events-none absolute overflow-hidden rounded-md border-2 ${
              selected
                ? "border-cobalt bg-white/40"
                : hovered
                  ? "border-ink/35 bg-white/25"
                  : "border-transparent"
            }`}
            style={{
              left: rect.left,
              top: rect.top,
              width: Math.max(8, rect.width),
              height: Math.max(8, rect.height),
            }}
          >
            {showAssets && asset ? (
              <img
                src={asset.src}
                alt={asset.name}
                draggable={false}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
