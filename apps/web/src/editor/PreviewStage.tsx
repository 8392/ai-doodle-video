import { VideoComposition } from "@ai-doodle/renderer";
import { getAsset } from "@ai-doodle/asset-library";
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState, type DragEvent, type RefObject } from "react";
import { readAssetDragId, isAssetDrag } from "./drag-drop";
import { PlaybackBar } from "./PlaybackBar";
import { PreviewOverlay } from "./PreviewOverlay";
import { resolveDropPosition } from "./preview-coords";
import { useEditorStore } from "../stores/editor-store";

export function PreviewStage({
  playerRef,
}: {
  playerRef: RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((state) => state.project);
  const addAssetAt = useEditorStore((state) => state.addAssetAt);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    setPlaying(player.isPlaying());
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, project?.id]);

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-ink/40">
        正在载入项目…
      </div>
    );
  }

  const activeProject = project;

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!isAssetDrag(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);

    const assetId = readAssetDragId(event.dataTransfer);
    const container = dropZoneRef.current;
    if (!assetId || !container) {
      return;
    }

    const asset = getAsset(assetId);
    if (!asset) {
      return;
    }

    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    const position = resolveDropPosition({
      clientX: event.clientX,
      clientY: event.clientY,
      containerRect: container.getBoundingClientRect(),
      project: activeProject,
      frame,
    });

    if (!position) {
      return;
    }

    addAssetAt(asset, position);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-[#ece6da] px-6 pb-4 pt-6">
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ aspectRatio: `${activeProject.width} / ${activeProject.height}` }}
          className={`relative h-full max-h-full overflow-hidden rounded-2xl border bg-black shadow-[0_24px_60px_rgba(23,23,23,0.12)] transition ${
            dragOver ? "border-cobalt ring-2 ring-cobalt/30" : "border-ink/10"
          }`}
        >
          <Player
            ref={playerRef as RefObject<PlayerRef>}
            component={VideoComposition}
            inputProps={{ project: activeProject, hideElements: !playing }}
            durationInFrames={activeProject.durationInFrames}
            fps={activeProject.fps}
            compositionWidth={activeProject.width}
            compositionHeight={activeProject.height}
            controls={false}
            autoPlay={false}
            style={{ width: "100%", height: "100%" }}
          />
          {dragOver ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-cobalt/10">
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-ink shadow-sm">
                松手放到这里
              </span>
            </div>
          ) : null}
          <PreviewOverlay
            containerRef={dropZoneRef}
            playerRef={playerRef}
            enabled={!dragOver && !playing}
            showAssets={!playing}
          />
        </div>
      </div>
      <PlaybackBar
        playerRef={playerRef}
        fps={activeProject.fps}
        durationInFrames={activeProject.durationInFrames}
      />
    </div>
  );
}
