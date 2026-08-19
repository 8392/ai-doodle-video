import { VideoComposition } from "@ai-doodle/renderer";
import { Player, type PlayerRef } from "@remotion/player";
import type { RefObject } from "react";
import { useEditorStore } from "../stores/editor-store";

export function PreviewStage({
  playerRef,
}: {
  playerRef: RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((state) => state.project);

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink/40">
        正在载入项目…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#ece6da] p-6">
      <div className="h-full max-h-full overflow-hidden rounded-2xl border border-ink/10 bg-black shadow-[0_24px_60px_rgba(23,23,23,0.12)]">
        <Player
          ref={playerRef as RefObject<PlayerRef>}
          component={VideoComposition}
          inputProps={{ project }}
          durationInFrames={project.durationInFrames}
          fps={project.fps}
          compositionWidth={project.width}
          compositionHeight={project.height}
          controls
          autoPlay={false}
          style={{
            height: "100%",
            maxHeight: "100%",
            aspectRatio: `${project.width} / ${project.height}`,
          }}
        />
      </div>
    </div>
  );
}
