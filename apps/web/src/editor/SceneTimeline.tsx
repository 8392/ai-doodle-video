import type { PlayerRef } from "@remotion/player";
import { ChevronLeft, ChevronRight, Clapperboard } from "lucide-react";
import { useState, type RefObject } from "react";
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
  const [expanded, setExpanded] = useState(true);

  if (!project) {
    return null;
  }

  const activeIndex = project.scenes.findIndex((scene) => scene.id === selectedSceneId);

  function jumpToScene(sceneId: string, elementId?: string, startFrame?: number) {
    selectScene(sceneId);
    selectElement(elementId ?? null);
    playerRef.current?.pause();
    if (startFrame !== undefined) {
      playerRef.current?.seekTo(startFrame);
    }
  }

  if (!expanded) {
    return (
      <aside className="flex h-full w-11 shrink-0 flex-col border-r border-ink/10 bg-white">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title="展开 Scene Timeline"
          className="flex flex-col items-center gap-2 border-b border-ink/10 px-2 py-3 text-ink/50 hover:bg-paper hover:text-ink"
        >
          <ChevronRight size={16} />
          <Clapperboard size={16} />
          <span
            className="text-[10px] font-medium uppercase tracking-widest [writing-mode:vertical-rl]"
          >
            Scenes
          </span>
        </button>
        <div className="flex flex-1 flex-col items-center gap-1.5 py-3">
          {project.scenes.map((scene, index) => {
            const active = scene.id === selectedSceneId;
            return (
              <button
                key={scene.id}
                type="button"
                title={scene.narration ?? scene.id}
                onClick={() =>
                  jumpToScene(scene.id, scene.elements[0]?.id, scene.startFrame)
                }
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium ${
                  active
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink/60 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
            Scene Timeline
          </p>
          <p className="mt-0.5 text-[11px] text-ink/40">
            {project.scenes.length} 个场景
            {activeIndex >= 0 ? ` · 当前 ${activeIndex + 1}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          title="收起 Scene Timeline"
          className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-ink"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {project.scenes.map((scene, index) => {
            const active = scene.id === selectedSceneId;
            const seconds = (scene.durationInFrames / project.fps).toFixed(1);
            return (
              <li key={scene.id}>
                <button
                  type="button"
                  onClick={() =>
                    jumpToScene(scene.id, scene.elements[0]?.id, scene.startFrame)
                  }
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/10 bg-paper text-ink hover:border-ink/25 hover:bg-white"
                  }`}
                >
                  <span className="block text-[11px] opacity-70">
                    Scene {index + 1} · {seconds}s
                  </span>
                  <span className="mt-1 block text-sm leading-5">
                    {scene.narration ?? scene.id}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="border-t border-ink/10 px-3 py-2 text-[10px] leading-4 text-ink/40">
        点击 Scene 跳转到对应时间。拖动改时长将在后续版本提供。
      </p>
    </aside>
  );
}
