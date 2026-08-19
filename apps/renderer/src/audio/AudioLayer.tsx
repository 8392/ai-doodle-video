import type { AudioTrack } from "@ai-doodle/video-schema";
import { Audio, Sequence } from "remotion";
import { toStaticSrc } from "../lib/to-static-src";

function Track({ track }: { track: AudioTrack }) {
  return (
    <Sequence
      from={track.startFrame}
      durationInFrames={Math.floor(track.durationInFrames)}
      layout="none"
    >
      <Audio src={toStaticSrc(track.src)} volume={track.volume ?? 1} />
    </Sequence>
  );
}

export function AudioLayer({
  narration,
  music,
}: {
  narration?: AudioTrack;
  music?: AudioTrack;
}) {
  return (
    <>
      {narration ? <Track track={narration} /> : null}
      {music ? <Track track={music} /> : null}
    </>
  );
}
