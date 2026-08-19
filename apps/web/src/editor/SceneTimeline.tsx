import type { PlayerRef } from "@remotion/player";
import type { RefObject } from "react";
import { useEditorStore } from "../stores/editor-store";

export function SceneTimeline({
  playerRef,
}: {
  playerRef: RefObject<PlayerRef | null>;
}) {
  const project = useEditorStore((state) => state.project);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const selectScene = useEditorStore((state) => state.selectScene);
  const selectElement = useEditorStore((state) => state.selectElement);

  if (!project) {
    return null;
  }

  const total = Math.max(project.durationInFrames, 1);

  return (
    <div className="shrink-0 border-t border-ink/10 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
          Scene Timeline
        </p>
        <p className="text-xs text-ink/40">
          点击 Scene 跳转到对应时间 · 拖动改时长将在后续版本提供
        </p>
      </div>
      <div className="flex overflow-x-auto rounded-xl border border-ink/10">
        {project.scenes.map((scene, index) => {
          const width = `${Math.max(18, (scene.durationInFrames / total) * 100)}%`;
          const active = scene.id === selectedSceneId;
          const seconds = (scene.durationInFrames / project.fps).toFixed(1);
          return (
            <button
              key={scene.id}
              type="button"
              style={{ flex: `0 0 ${width}`, minWidth: "180px" }}
              onClick={() => {
                selectScene(scene.id);
                selectElement(scene.elements[0]?.id ?? null);
                playerRef.current?.pause();
                playerRef.current?.seekTo(scene.startFrame);
              }}
              className={`border-r border-ink/10 px-3 py-2.5 text-left last:border-r-0 ${
                active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-white"
              }`}
            >
              <span className="block text-[11px] opacity-70">
                Scene {index + 1} · {seconds}s
              </span>
              <span className="mt-1 block text-sm leading-5">
                {scene.narration ?? scene.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
