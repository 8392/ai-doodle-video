import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import { loadDemoProject } from "./demo-project";

const project = loadDemoProject();

export const RemotionRoot = () => {
  return (
    <Composition
      id="Demo"
      component={VideoComposition}
      durationInFrames={project.durationInFrames}
      fps={project.fps}
      width={project.width}
      height={project.height}
      defaultProps={{ project }}
    />
  );
};
