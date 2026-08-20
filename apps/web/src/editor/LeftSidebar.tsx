import type { PlayerRef } from "@remotion/player";
import type { RefObject } from "react";
import { AssetLibrary } from "./AssetLibrary";
import { SceneTimeline } from "./SceneTimeline";

export function LeftSidebar({
  playerRef,
}: {
  playerRef: RefObject<PlayerRef | null>;
}) {
  return (
    <div className="flex h-full min-h-0 shrink-0">
      <AssetLibrary />
      <SceneTimeline playerRef={playerRef} />
    </div>
  );
}
