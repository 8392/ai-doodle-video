import { Download, Play, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { downloadJson } from "../lib/local-project";
import { useEditorStore } from "../stores/editor-store";
import { usePreviewStore } from "../stores/preview-store";
import { ExportMp4Button } from "./ExportMp4Button";

export function EditorHeader() {
  const navigate = useNavigate();
  const project = useEditorStore((state) => state.project);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const setName = useEditorStore((state) => state.setName);
  const persist = useEditorStore((state) => state.persist);
  const setPreviewProject = usePreviewStore((state) => state.setProject);

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
    <header className="flex h-14 items-center justify-between border-b border-ink/10 bg-white px-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/create" className="shrink-0 text-sm text-ink/50 hover:text-ink">
          返回
        </Link>
        <input
          value={project.name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 max-w-md truncate border-b border-transparent bg-transparent font-display text-lg outline-none focus:border-ink"
        />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        {saveStatus === "saved" ? (
          <span className="text-xs text-ink/40">已保存到浏览器本地</span>
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
    </header>
  );
}
