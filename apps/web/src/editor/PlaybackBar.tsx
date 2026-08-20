import type { PlayerRef } from "@remotion/player";
import { Pause, Play } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.max(0, frame) / Math.max(1, fps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PlaybackBar({
  playerRef,
  fps,
  durationInFrames,
}: {
  playerRef: RefObject<PlayerRef | null>;
  fps: number;
  durationInFrames: number;
}) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const syncFrame = () => setFrame(player.getCurrentFrame());
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    player.addEventListener("frameupdate", syncFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    syncFrame();
    setPlaying(player.isPlaying());

    return () => {
      player.removeEventListener("frameupdate", syncFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, durationInFrames]);

  return (
    <div className="mt-3 flex w-full max-w-[420px] items-center gap-3 rounded-xl border border-ink/10 bg-white px-3 py-2">
      <button
        type="button"
        onClick={() => {
          const player = playerRef.current;
          if (!player) {
            return;
          }
          if (player.isPlaying()) {
            player.pause();
            return;
          }
          player.play();
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-paper hover:bg-ink/90"
        title={playing ? "暂停" : "播放"}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(0, durationInFrames - 1)}
        value={Math.min(frame, Math.max(0, durationInFrames - 1))}
        onChange={(event) => {
          const next = Number(event.target.value);
          playerRef.current?.pause();
          playerRef.current?.seekTo(next);
          setFrame(next);
        }}
        className="h-1.5 flex-1 cursor-pointer accent-cobalt"
      />
      <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-ink/50">
        {formatTimecode(frame, fps)}
      </span>
    </div>
  );
}
