import { Download, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { downloadJson } from "../lib/local-project";
import { useEditorStore } from "../stores/editor-store";

export function EditorHeader() {
  const project = useEditorStore((state) => state.project);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const setName = useEditorStore((state) => state.setName);
  const persist = useEditorStore((state) => state.persist);

  if (!project) {
    return null;
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
      <div className="flex items-center gap-2">
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
          onClick={() =>
            downloadJson(`${project.id}.json`, JSON.stringify(project, null, 2))
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
        >
          <Download size={14} />
          导出 JSON
        </button>
        <button
          type="button"
          title="MP4 仍走本地命令 pnpm render:demo，本阶段没有云渲染"
          className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm text-ink/45"
        >
          导出 MP4
        </button>
        <span className="rounded-lg bg-ink px-3 py-1.5 text-sm text-paper">
          预览
        </span>
      </div>
    </header>
  );
}
