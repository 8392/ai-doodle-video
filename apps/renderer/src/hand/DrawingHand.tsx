import { getAssetOrThrow } from "@ai-doodle/asset-library";
import { Img, useVideoConfig } from "remotion";
import type { ResolvedCamera } from "../camera/interpolate-camera";
import { toStaticSrc } from "../lib/to-static-src";
import { fitHandInFrame, worldToScreen } from "./hand-layout";
import type { StrokePoint } from "./StrokeContext";

const HAND_SIZE = 240;
const PADDING = 12;
const RIGHT_TIP = { x: 0.2, y: 0.14 };
const LEFT_TIP = { x: 0.8, y: 0.14 };

export function DrawingHand({
  point,
  camera,
}: {
  point: StrokePoint;
  camera: ResolvedCamera;
}) {
  const { width, height } = useVideoConfig();

  if (!point.visible) {
    return null;
  }

  const screen = worldToScreen(point.x, point.y, camera, width, height);
  const useLeft = screen.x > width * 0.62;
  const variant = useLeft ? "hand-left" : "hand-right";
  const tip = useLeft ? LEFT_TIP : RIGHT_TIP;
  const asset = getAssetOrThrow(variant);
  const box = fitHandInFrame({
    tipX: screen.x - HAND_SIZE * tip.x,
    tipY: screen.y - HAND_SIZE * tip.y,
    handWidth: HAND_SIZE,
    handHeight: HAND_SIZE,
    frameWidth: width,
    frameHeight: height,
    padding: PADDING,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: HAND_SIZE,
        height: HAND_SIZE,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <Img
        src={toStaticSrc(asset.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
