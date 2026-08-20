import { loadDemoProject, VideoComposition } from "@ai-doodle/renderer";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";
import { Player } from "@remotion/player";
import { Clapperboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { flattenSceneCameras } from "../editor/project-edits";
import { loadProjectJson } from "../lib/local-project";
import { usePreviewStore } from "../stores/preview-store";

function resolvePreviewProject(projectId: string | undefined): VideoProject {
  const staged = usePreviewStore.getState().project;
  if (staged && (!projectId || staged.id === projectId)) {
    return flattenSceneCameras(staged);
  }

  if (projectId) {
    const stored = loadProjectJson(projectId);
    if (stored) {
      try {
        return flattenSceneCameras(parseVideoProject(JSON.parse(stored) as unknown));
      } catch {
        // fall through to demo
      }
    }
  }

  return flattenSceneCameras({ ...loadDemoProject(), id: projectId ?? "demo" });
}

export function PreviewPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<VideoProject | null>(null);

  useEffect(() => {
    setProject(resolvePreviewProject(projectId));
  }, [projectId]);

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
            <Link
              to={editorHref}
              className="text-sm text-ink/50 hover:text-ink"
            >
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
