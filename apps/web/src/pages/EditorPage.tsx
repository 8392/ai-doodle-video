import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { EditorHeader } from "../editor/EditorHeader";
import { LeftSidebar } from "../editor/LeftSidebar";
import { PreviewStage } from "../editor/PreviewStage";
import { PropertiesPanel } from "../editor/PropertiesPanel";
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
      <div className="flex min-h-0 flex-1">
        <LeftSidebar playerRef={playerRef} />
        <PreviewStage playerRef={playerRef} />
        <PropertiesPanel />
      </div>
    </div>
  );
}
