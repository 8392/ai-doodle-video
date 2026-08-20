import { Composition } from "remotion";
import { parseVideoProject } from "@ai-doodle/video-schema";
import { VideoComposition, type VideoCompositionProps } from "./compositions/VideoComposition";
import { loadDemoProject } from "./demo-project";

const demo = loadDemoProject();

function calculateMetadata({ props }: { props: VideoCompositionProps }) {
  const project = parseVideoProject(props.project);
  return {
    durationInFrames: project.durationInFrames,
    fps: project.fps,
    width: project.width,
    height: project.height,
    props: { project },
  };
}

export const RemotionRoot = () => {
  return (
    <Composition
      id="Demo"
      component={VideoComposition}
      durationInFrames={demo.durationInFrames}
      fps={demo.fps}
      width={demo.width}
      height={demo.height}
      defaultProps={{ project: demo }}
      calculateMetadata={calculateMetadata}
    />
  );
};
