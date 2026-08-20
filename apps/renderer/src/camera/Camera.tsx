import type { ReactNode } from "react";
import { fillFrameStyle } from "../lib/fill-frame";
import type { ResolvedCamera } from "./interpolate-camera";

type CameraViewProps = {
  camera: ResolvedCamera;
  width: number;
  height: number;
  children: ReactNode;
};

export function CameraView({ camera, width, height, children }: CameraViewProps) {
  return (
    <div
      style={{
        ...fillFrameStyle,
        transformOrigin: `${width / 2}px ${height / 2}px`,
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
      }}
    >
      {children}
    </div>
  );
}
