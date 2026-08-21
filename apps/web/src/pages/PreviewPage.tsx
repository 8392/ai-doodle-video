import { loadDemoProject, VideoComposition } from "@ai-doodle/renderer";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";
import { Player } from "@remotion/player";
import { Clapperboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadProjectJson } from "../lib/local-project";
import { usePreviewStore } from "../stores/preview-store";

function resolvePreviewProject(projectId: string | undefined): VideoProject | null {
  const staged = usePreviewStore.getState().project;
  if (staged && (!projectId || staged.id === projectId)) {
    return staged;
  }

  if (projectId) {
    const stored = loadProjectJson(projectId);
    if (stored) {
      try {
        return parseVideoProject(JSON.parse(stored) as unknown);
      } catch {
        return null;
      }
    }
  }

  if (projectId === "demo" || !projectId) {
    return { ...loadDemoProject(), id: projectId ?? "demo" };
  }
  return null;
}

export function PreviewPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const next = resolvePreviewProject(projectId);
    setProject(next);
    setMissing(!next);
  }, [projectId]);

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-ink">
        <p>找不到这个项目。</p>
        <Link to="/projects" className="text-sm text-ink/50">
          返回项目列表
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">
        正在载入预览…
      </div>
    );
  }

  const editorHref = `/editor/${project.id}`;

  return (
    <div className="min-h-screen bg-paper px-6 py-8 text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/50">
              <Clapperboard size={14} />
              当前项目预览
            </div>
            <h1 className="font-display text-3xl tracking-tight">{project.name}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">
              这是编辑器里当前项目的播放预览，不是导出 MP4。
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/60">
              {project.width}×{project.height} · {project.fps}fps ·{" "}
              {(project.durationInFrames / project.fps).toFixed(1)}s
            </div>
            <Link to={editorHref} className="text-sm text-ink/50 hover:text-ink">
              返回编辑器
            </Link>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-neutral-950 shadow-sm">
          <Player
            component={VideoComposition}
            inputProps={{ project }}
            durationInFrames={project.durationInFrames}
            fps={project.fps}
            compositionWidth={project.width}
            compositionHeight={project.height}
            controls
            autoPlay
            style={{
              width: "100%",
              aspectRatio: `${project.width} / ${project.height}`,
              maxHeight: "78vh",
            }}
          />
        </div>
      </div>
    </div>
  );
}
