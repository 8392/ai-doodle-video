import type { PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { EditorHeader } from "../editor/EditorHeader";
import { LeftSidebar } from "../editor/LeftSidebar";
import { PreviewStage } from "../editor/PreviewStage";
import { PropertiesPanel } from "../editor/PropertiesPanel";
import { useEditorStore } from "../stores/editor-store";

export function EditorPage() {
  const { projectId } = useParams();
  const loadProject = useEditorStore((state) => state.loadProject);
  const persist = useEditorStore((state) => state.persist);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const project = useEditorStore((state) => state.project);
  const loadError = useEditorStore((state) => state.loadError);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    loadProject(projectId ?? "demo");
  }, [loadProject, projectId]);

  useEffect(() => {
    if (!project || saveStatus === "saved" || saveStatus === "saving") {
      return;
    }
    const timer = window.setTimeout(() => persist(), 700);
    return () => window.clearTimeout(timer);
  }, [persist, project, saveStatus]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  if (loadError && !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-ink">
        <p>{loadError}</p>
        <Link to="/projects" className="text-sm text-ink/50">
          返回项目列表
        </Link>
      </div>
    );
  }

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
