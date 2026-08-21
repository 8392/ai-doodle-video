import type { PlayerRef } from "@remotion/player";
import { getAsset } from "@ai-doodle/asset-library";
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { flushSync } from "react-dom";
import Moveable from "react-moveable";
import {
  elementOverlayRect,
  hitTestElement,
  overlayRectToElementPatch,
  screenToCompositionPoint,
} from "./preview-coords";
import { findSceneIndexAtFrame, resolveCameraAtFrame } from "./project-edits";
import { useEditorStore } from "../stores/editor-store";

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
  const [keepRatio, setKeepRatio] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setTarget(selectedElementId ? targetRef.current : null);
  }, [selectedElementId, size, frame, project]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      );
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Shift" && !isTypingTarget(event.target)) {
        setKeepRatio(true);
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setKeepRatio(false);
      }
    }
    function onBlur() {
      setKeepRatio(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

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

  function commitTargetBox(box: HTMLElement | SVGElement) {
    const container = containerRef.current;
    const elementId = selectedElementId;
    if (!container || !project || !elementId || !(box instanceof HTMLElement)) {
      return;
    }
    const patch = overlayRectToElementPatch({
      left: Number.parseFloat(box.style.left) || box.offsetLeft,
      top: Number.parseFloat(box.style.top) || box.offsetTop,
      width: box.offsetWidth,
      height: box.offsetHeight,
      containerRect: container.getBoundingClientRect(),
      compositionWidth: project.width,
      compositionHeight: project.height,
      camera: resolveCameraAtFrame(
        project,
        playerRef.current?.getCurrentFrame() ?? frame,
      ),
    });
    if (!patch) {
      return;
    }
    moveElement(elementId, patch);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || event.button !== 0 || !scene) {
      return;
    }
    const eventTarget = event.target;
    if (
      eventTarget instanceof Element &&
      eventTarget.closest(".moveable-control-box, .moveable-line, [data-element-target]")
    ) {
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
    selectScene(scene.id);
    selectElement(hit.id);
    playerRef.current?.pause();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!enabled) {
      return;
    }
    const point = compositionPoint(event.clientX, event.clientY);
    setHoverId(point ? hitTestElement(elements, point)?.id ?? null : null);
  }

  return (
    <div
      className={`absolute inset-0 z-20 ${enabled ? "" : "pointer-events-none"} ${
        hoverId && hoverId !== selectedElementId ? "cursor-pointer" : "cursor-default"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverId(null)}
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
        const asset = element.assetId ? getAsset(element.assetId) : undefined;
        const previewSrc = asset?.src ?? element.src;
        return (
          <div
            key={element.id}
            ref={selected ? targetRef : undefined}
            data-element-target={selected ? "true" : undefined}
            className={`absolute overflow-hidden rounded-md ${
              selected
                ? "z-10"
                : hovered
                  ? "border-2 border-ink/35 bg-white/25"
                  : "border-2 border-transparent"
            }`}
            style={{
              left: rect.left,
              top: rect.top,
              width: Math.max(8, rect.width),
              height: Math.max(8, rect.height),
            }}
          >
            {showAssets && previewSrc ? (
              <img
                src={previewSrc}
                alt={asset?.name ?? element.text ?? "上传图片"}
                draggable={false}
                className="pointer-events-none h-full w-full object-contain"
              />
            ) : showAssets && element.type === "text" ? (
              <div className="pointer-events-none flex h-full w-full items-center justify-center bg-white/70 px-1 text-center text-[10px] text-ink/70">
                {element.text || "文字"}
              </div>
            ) : null}
          </div>
        );
      })}
      {enabled && target ? (
        <Moveable
          key={selectedElementId}
          flushSync={flushSync}
          target={target}
          draggable
          resizable
          origin={false}
          keepRatio={keepRatio}
          keepRatioFinally={keepRatio}
          useResizeObserver
          throttleDrag={1}
          throttleResize={1}
          renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
          className="icon-moveable"
          onDrag={({ target: box, left, top }) => {
            box.style.left = `${left}px`;
            box.style.top = `${top}px`;
          }}
          onResize={({ target: box, width, height, drag }) => {
            box.style.width = `${width}px`;
            box.style.height = `${height}px`;
            box.style.left = `${drag.left}px`;
            box.style.top = `${drag.top}px`;
          }}
          onDragEnd={({ target: box }) => commitTargetBox(box)}
          onResizeEnd={({ target: box }) => commitTargetBox(box)}
        />
      ) : null}
    </div>
  );
}
