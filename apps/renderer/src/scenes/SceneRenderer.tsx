import type { VideoProject } from "@ai-doodle/video-schema";
import { useMemo, useState } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CameraView } from "../camera/Camera";
import { interpolateCamera } from "../camera/interpolate-camera";
import { ElementRenderer } from "../elements/ElementRenderer";
import { computeElementMotion } from "../elements/motion";
import { DrawingHand } from "../hand/DrawingHand";
import { hiddenPoint, StrokeProvider, type StrokePoint } from "../hand/StrokeContext";
import { findSceneIndexAtFrame, visibleScenes } from "../lib/scenes";

export function SceneRenderer({ project }: { project: VideoProject }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [stroke, setStroke] = useState<StrokePoint>(hiddenPoint);

  const sceneIndex = findSceneIndexAtFrame(project, frame);
  const currentScene = project.scenes[sceneIndex];
  if (!currentScene) {
    throw new Error("Scene list is empty");
  }

  const localFrame = frame - currentScene.startFrame;
  const camera = interpolateCamera(project, sceneIndex, localFrame);
  const scenes = visibleScenes(project, frame);

  const activeDrawId = useMemo(() => {
    for (const scene of scenes) {
      const sceneLocal = frame - scene.startFrame;
      for (const element of scene.elements) {
        if (element.animation?.type !== "draw") {
          continue;
        }
        const motion = computeElementMotion(element, sceneLocal);
        if (motion.drawProgress > 0 && motion.drawProgress < 1) {
          return element.id;
        }
      }
    }
    return null;
  }, [frame, scenes]);

  return (
    <StrokeProvider point={stroke} setPoint={setStroke}>
      <CameraView camera={camera} width={width} height={height}>
        {scenes.flatMap((scene) => {
          const sceneLocal = frame - scene.startFrame;
          return scene.elements.map((element) => (
            <ElementRenderer
              key={element.id}
              element={element}
              localFrame={sceneLocal}
              reportStroke={element.id === activeDrawId}
            />
          ));
        })}
      </CameraView>
      <DrawingHand point={stroke} camera={camera} />
    </StrokeProvider>
  );
}
