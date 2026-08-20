import type { VideoProject } from "@ai-doodle/video-schema";
import { AbsoluteFill } from "remotion";
import { AudioLayer } from "../audio/AudioLayer";
import { CaptionRenderer } from "../captions/CaptionRenderer";
import { PaperBackground } from "../scenes/PaperBackground";
import { SceneRenderer } from "../scenes/SceneRenderer";

export type VideoCompositionProps = {
  project: VideoProject;
  hideElements?: boolean;
};

export const VideoComposition = ({
  project,
  hideElements = false,
}: VideoCompositionProps) => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperBackground color={project.background.color} />
      {hideElements ? null : <SceneRenderer project={project} />}
      <CaptionRenderer captions={project.captions ?? []} />
      <AudioLayer
        narration={project.narration}
        music={project.music}
      />
    </AbsoluteFill>
  );
};
