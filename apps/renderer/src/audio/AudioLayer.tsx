import type { AudioTrack, Scene } from "@ai-doodle/video-schema";
import { Audio } from "@remotion/media";
import { Sequence } from "remotion";
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
  scenes = [],
}: {
  narration?: AudioTrack;
  music?: AudioTrack;
  scenes?: Scene[];
}) {
  const sceneClips = scenes.filter((scene) => scene.audio);
  const hasSpeech = Boolean(narration) || sceneClips.length > 0;
  const duckedMusic = music
    ? { ...music, volume: (music.volume ?? 0.18) * (hasSpeech ? 1 : 1) }
    : undefined;
  return (
    <>
      {sceneClips.map((scene) =>
        scene.audio ? (
          <Track
            key={`${scene.id}:${scene.audio.src}`}
            track={{
              ...scene.audio,
              startFrame: scene.audio.startFrame || scene.startFrame,
            }}
          />
        ) : null,
      )}
      {sceneClips.length === 0 && narration ? <Track track={narration} /> : null}
      {duckedMusic ? (
        <Track
          track={{
            ...duckedMusic,
            volume: hasSpeech ? Math.min(0.2, duckedMusic.volume ?? 0.16) : duckedMusic.volume,
          }}
        />
      ) : null}
    </>
  );
}
