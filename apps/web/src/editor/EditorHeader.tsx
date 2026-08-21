import { Download, Play, Redo2, Save, Share2, Undo2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { downloadJson } from "../lib/local-project";
import { createShareLink } from "../lib/session";
import { useEditorStore } from "../stores/editor-store";
import { usePreviewStore } from "../stores/preview-store";
import { ExportMp4Button } from "./ExportMp4Button";
import { useState } from "react";

export function EditorHeader() {
  const navigate = useNavigate();
  const project = useEditorStore((state) => state.project);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const setName = useEditorStore((state) => state.setName);
  const persist = useEditorStore((state) => state.persist);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const setPreviewProject = usePreviewStore((state) => state.setProject);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  if (!project) {
    return null;
  }

  const current = project;
  const jsonName = `${current.id}.json`;

  function downloadProjectJson() {
    downloadJson(jsonName, JSON.stringify(current, null, 2));
  }

  function openPreview() {
    persist();
    setPreviewProject(current);
    navigate(`/preview/${current.id}`);
  }

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-ink/10 bg-white px-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/projects" className="shrink-0 text-sm text-ink/50 hover:text-ink">
          项目
        </Link>
        <input
          value={project.name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 max-w-md truncate border-b border-transparent bg-transparent font-display text-lg outline-none focus:border-ink"
        />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          disabled={past.length === 0}
          onClick={undo}
          className="rounded-lg border border-ink/10 p-1.5 disabled:opacity-30"
          title="撤销"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          disabled={future.length === 0}
          onClick={redo}
          className="rounded-lg border border-ink/10 p-1.5 disabled:opacity-30"
          title="重做"
        >
          <Redo2 size={14} />
        </button>
        {saveStatus === "saved" ? (
          <span className="text-xs text-ink/40">已自动保存</span>
        ) : saveStatus === "saving" ? (
          <span className="text-xs text-ink/40">正在保存…</span>
        ) : null}
        {saveStatus === "error" ? (
          <span className="text-xs text-red-600">保存失败</span>
        ) : null}
        <button
          type="button"
          onClick={persist}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
        >
          <Save size={14} />
          保存
        </button>
        <button
          type="button"
          onClick={() => {
            persist();
            void createShareLink(current.id)
              .then((url) => {
                const absolute = `${window.location.origin}${url}`;
                setShareUrl(absolute);
                void navigator.clipboard?.writeText(absolute).catch(() => undefined);
              })
              .catch((error: unknown) =>
                setShareUrl(error instanceof Error ? error.message : "分享失败"),
              );
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
        >
          <Share2 size={14} />
          分享
        </button>
        <button
          type="button"
          onClick={downloadProjectJson}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
        >
          <Download size={14} />
          导出 JSON
        </button>
        <ExportMp4Button project={project} />
        <button
          type="button"
          onClick={openPreview}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm text-paper hover:bg-ink/90"
        >
          <Play size={14} />
          预览
        </button>
      </div>
      {shareUrl ? (
        <p className="absolute right-4 top-16 z-20 max-w-sm truncate rounded-lg border border-ink/10 bg-white px-3 py-1 text-xs text-ink/60">
          {shareUrl}
        </p>
      ) : null}
    </header>
  );
}
