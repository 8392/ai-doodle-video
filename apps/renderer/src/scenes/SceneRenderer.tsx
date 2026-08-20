import type { VideoProject } from "@ai-doodle/video-schema";
import { useMemo, useState, type CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CameraView } from "../camera/Camera";
import { interpolateCamera } from "../camera/interpolate-camera";
import { ElementRenderer } from "../elements/ElementRenderer";
import { isDrawAnimationActive } from "../elements/motion";
import { sequenceElementAnimations } from "../elements/sequence";
import { DrawingHand } from "../hand/DrawingHand";
import { hiddenPoint, StrokeProvider, type StrokePoint } from "../hand/StrokeContext";
import { findSceneIndexAtFrame, visibleScenes } from "../lib/scenes";
import {
  incomingTransitionProgress,
  resolveSceneTransition,
  sceneLayerStyle,
} from "../transitions/scene-transition";

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
  const transition = resolveSceneTransition(project, currentScene);
  const progress = incomingTransitionProgress(
    sceneIndex,
    localFrame,
    transition,
    currentScene.durationInFrames,
  );

  const activeDrawId = useMemo(() => {
    if (progress < 1) {
      return null;
    }
    for (const scene of scenes) {
      if (scene.id !== currentScene.id) {
        continue;
      }
      const sceneLocal = frame - scene.startFrame;
      for (const element of sequenceElementAnimations(scene.elements)) {
        if (isDrawAnimationActive(element, sceneLocal)) {
          return element.id;
        }
      }
    }
    return null;
  }, [currentScene.id, frame, progress, scenes]);

  return (
    <StrokeProvider point={stroke} setPoint={setStroke}>
      {scenes.map((scene) => {
        const index = project.scenes.findIndex((item) => item.id === scene.id);
        const incoming = scene.id === currentScene.id;
        const sceneLocal = incoming
          ? localFrame
          : Math.max(0, scene.durationInFrames - 1);
        const style = sceneLayerStyle(
          incoming ? "in" : "out",
          transition.type,
          progress,
          width,
          height,
        );
        const layerStyle: CSSProperties = {
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          opacity: style.opacity,
          transform: style.transform,
          pointerEvents: "none",
        };
        return (
          <div key={scene.id} style={layerStyle}>
            <CameraView
              camera={interpolateCamera(project, index, sceneLocal)}
              width={width}
              height={height}
            >
              {sequenceElementAnimations(scene.elements).map((element) => (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  localFrame={sceneLocal}
                  reportStroke={incoming && element.id === activeDrawId}
                />
              ))}
            </CameraView>
          </div>
        );
      })}
      <DrawingHand point={stroke} camera={camera} />
    </StrokeProvider>
  );
}
