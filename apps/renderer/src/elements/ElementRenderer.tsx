import type { Element } from "@ai-doodle/video-schema";
import { ArrowElement } from "./ArrowElement";
import { HandElement } from "./HandElement";
import { ImageElement } from "./ImageElement";
import { computeElementMotion } from "./motion";
import { ShapeElement } from "./ShapeElement";
import { SvgElement } from "./SvgElement";
import { TextElement } from "./TextElement";

type ElementRendererProps = {
  element: Element;
  localFrame: number;
  reportStroke: boolean;
};

export function ElementRenderer({
  element,
  localFrame,
  reportStroke,
}: ElementRendererProps) {
  const motion = computeElementMotion(element, localFrame);
  const width = element.width ?? 320;
  const height = element.height ?? 320;

  return (
    <div
      style={{
        position: "absolute",
        left: element.x + motion.translateX,
        top: element.y + motion.translateY,
        width,
        height,
        opacity: motion.opacity,
        zIndex: element.zIndex ?? 0,
        transform: `rotate(${element.rotation ?? 0}deg) scale(${motion.scale})`,
        transformOrigin: "center center",
      }}
    >
      {renderByType(element, motion.drawProgress, reportStroke)}
    </div>
  );
}

function renderByType(
  element: Element,
  drawProgress: number,
  reportStroke: boolean,
) {
  switch (element.type) {
    case "svg":
      return (
        <SvgElement
          element={element}
          drawProgress={drawProgress}
          reportStroke={reportStroke}
        />
      );
    case "image":
      return <ImageElement element={element} />;
    case "text":
      return <TextElement element={element} />;
    case "shape":
      return <ShapeElement element={element} />;
    case "arrow":
      return <ArrowElement element={element} />;
    case "hand":
      return <HandElement element={element} />;
    default: {
      const exhaustive: never = element.type;
      throw new Error(`Unsupported element type: ${exhaustive}`);
    }
  }
}
