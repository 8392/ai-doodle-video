import { loadDemoProject, VideoComposition } from "@ai-doodle/renderer";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";
import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSharedProject } from "../lib/session";

export function SharePage() {
  const { shareId } = useParams();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) {
      setError("缺少分享 id");
      return;
    }
    void fetchSharedProject(shareId)
      .then((raw) => setProject(parseVideoProject(raw)))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "无法打开分享"),
      );
  }, [shareId]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-ink">
        <p>{error}</p>
        <Link to="/create" className="text-sm text-ink/50">
          回去创建
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink/45">
        正在打开分享…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-8 text-ink">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs text-ink/40">只读分享</p>
        <h1 className="mt-2 font-display text-3xl">{project.name}</h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-black">
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

export function fallbackDemo(): VideoProject {
  return loadDemoProject();
}
