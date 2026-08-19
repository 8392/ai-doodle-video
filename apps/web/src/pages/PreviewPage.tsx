import { loadDemoProject, VideoComposition } from "@ai-doodle/renderer";
import { Player } from "@remotion/player";
import { useEffect } from "react";
import { Clapperboard } from "lucide-react";
import { usePreviewStore } from "../stores/preview-store";

export function PreviewPage() {
  const project = usePreviewStore((state) => state.project);
  const setProject = usePreviewStore((state) => state.setProject);

  useEffect(() => {
    setProject(loadDemoProject());
  }, [setProject]);

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-500">
        Loading demo project…
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500">
              <Clapperboard size={14} />
              Phase 1 · doodle engine preview
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Fixed <code className="rounded bg-white px-1">demo-project.json</code>.
              SVG paths are stroked in sequence. Audio is a local placeholder, not TTS.
              AI generation is not wired in this phase.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            {project.width}×{project.height} · {project.fps}fps ·{" "}
            {(project.durationInFrames / project.fps).toFixed(1)}s
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-sm">
          <Player
            component={VideoComposition}
            inputProps={{ project }}
            durationInFrames={project.durationInFrames}
            fps={project.fps}
            compositionWidth={project.width}
            compositionHeight={project.height}
            controls
            autoPlay={false}
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
