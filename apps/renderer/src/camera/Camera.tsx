import type { ReactNode } from "react";
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
        position: "absolute",
        inset: 0,
        transformOrigin: `${width / 2}px ${height / 2}px`,
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
      }}
    >
      {children}
    </div>
  );
}
