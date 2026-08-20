import type { PlayerRef } from "@remotion/player";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clapperboard,
  Plus,
  Trash2,
} from "lucide-react";
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
  const addSceneAfterSelected = useEditorStore((state) => state.addSceneAfterSelected);
  const removeSelectedScene = useEditorStore((state) => state.removeSelectedScene);
  const moveSelectedScene = useEditorStore((state) => state.moveSelectedScene);
  const [expanded, setExpanded] = useState(true);

  if (!project) {
    return null;
  }

  const activeIndex = project.scenes.findIndex((scene) => scene.id === selectedSceneId);
  const canRemove = project.scenes.length > 1;

  function seekSelectedScene() {
    const next = useEditorStore.getState();
    const scene = next.project?.scenes.find((item) => item.id === next.selectedSceneId);
    if (!scene) {
      return;
    }
    playerRef.current?.pause();
    playerRef.current?.seekTo(scene.startFrame);
  }

  function jumpToScene(sceneId: string, elementId?: string, startFrame?: number) {
    selectScene(sceneId);
    selectElement(elementId ?? null);
    playerRef.current?.pause();
    if (startFrame !== undefined) {
      playerRef.current?.seekTo(startFrame);
    }
  }

  function handleAdd() {
    addSceneAfterSelected();
    seekSelectedScene();
  }

  function handleMove(direction: -1 | 1) {
    moveSelectedScene(direction);
    seekSelectedScene();
  }

  function handleRemove() {
    removeSelectedScene();
    seekSelectedScene();
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
          <span className="text-[10px] font-medium uppercase tracking-widest [writing-mode:vertical-rl]">
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
        <button
          type="button"
          title="在当前画布后添加"
          onClick={handleAdd}
          className="m-2 flex h-7 w-7 items-center justify-center rounded-full border border-ink/10 text-ink/50 hover:bg-paper hover:text-ink"
        >
          <Plus size={14} />
        </button>
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
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleAdd}
            title="在当前画布后添加"
            className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-ink"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            title="收起 Scene Timeline"
            className="rounded-md p-1.5 text-ink/45 hover:bg-paper hover:text-ink"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {project.scenes.map((scene, index) => {
            const active = scene.id === selectedSceneId;
            const seconds = (scene.durationInFrames / project.fps).toFixed(1);
            return (
              <li key={scene.id}>
                <div
                  className={`rounded-xl border transition ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/10 bg-paper text-ink hover:border-ink/25 hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      jumpToScene(scene.id, scene.elements[0]?.id, scene.startFrame)
                    }
                    className="w-full px-3 py-2.5 text-left"
                  >
                    <span className="block text-[11px] opacity-70">
                      Scene {index + 1} · {seconds}s
                    </span>
                    <span className="mt-1 block text-sm leading-5">
                      {scene.narration ?? scene.id}
                    </span>
                  </button>
                  {active ? (
                    <div className="flex items-center gap-1 border-t border-white/15 px-2 py-1.5">
                      <button
                        type="button"
                        title="上移"
                        disabled={index === 0}
                        onClick={() => handleMove(-1)}
                        className="rounded-md p-1 hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        title="下移"
                        disabled={index === project.scenes.length - 1}
                        onClick={() => handleMove(1)}
                        className="rounded-md p-1 hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        title={canRemove ? "删除画布" : "至少保留一个画布"}
                        disabled={!canRemove}
                        onClick={handleRemove}
                        className="ml-auto rounded-md p-1 hover:bg-white/10 disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="border-t border-ink/10 px-3 py-2 text-[10px] leading-4 text-ink/40">
        添加、删除或上下移动画布。时长和旁白在右侧属性里改。
      </p>
    </aside>
  );
}
