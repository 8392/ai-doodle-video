import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { AssetLibrary } from "../editor/AssetLibrary";
import { EditorHeader } from "../editor/EditorHeader";
import { PreviewStage } from "../editor/PreviewStage";
import { PropertiesPanel } from "../editor/PropertiesPanel";
import { SceneTimeline } from "../editor/SceneTimeline";
import { useEditorStore } from "../stores/editor-store";

export function EditorPage() {
  const { projectId } = useParams();
  const loadProject = useEditorStore((state) => state.loadProject);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    loadProject(projectId ?? "demo");
  }, [loadProject, projectId]);

  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      <EditorHeader />
      <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)_280px]">
        <AssetLibrary />
        <PreviewStage playerRef={playerRef} />
        <PropertiesPanel />
      </div>
      <SceneTimeline playerRef={playerRef} />
    </div>
  );
}
