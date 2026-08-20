import { Film } from "lucide-react";
import { useRef, useState } from "react";
import type { VideoProject } from "@ai-doodle/video-schema";
import { downloadBlob, downloadJson } from "../lib/local-project";
import { useEditorStore } from "../stores/editor-store";
import { renderProjectOnWeb } from "./render-on-web";

type ExportPhase = "idle" | "rendering" | "done" | "error";

export function ExportMp4Button({ project }: { project: VideoProject }) {
  const persist = useEditorStore((state) => state.persist);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<ExportPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [encodedFrames, setEncodedFrames] = useState(0);
  const jsonName = `${project.id}.json`;
  const mp4Name = `${project.id}.mp4`;
  const totalFrames = Math.max(1, project.durationInFrames);
  const percent = Math.min(99, Math.round((encodedFrames / totalFrames) * 100));
  const renderCommand = `pnpm render:json ./output/${jsonName}`;

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
  }

  async function exportMp4() {
    persist();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("rendering");
    setError(null);
    setEncodedFrames(0);

    try {
      const blob = await renderProjectOnWeb(project, {
        signal: controller.signal,
        onProgress: (progress) => setEncodedFrames(progress.encodedFrames),
      });
      downloadBlob(mp4Name, blob);
      setEncodedFrames(totalFrames);
      setPhase("done");
    } catch (caught) {
      if (controller.signal.aborted) {
        setPhase("idle");
        return;
      }
      setError(caught instanceof Error ? caught.message : "渲染失败");
      setPhase("error");
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={phase === "rendering"}
        title="在浏览器里编码当前项目并下载 MP4"
        onClick={() => void exportMp4()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper disabled:opacity-50"
      >
        <Film size={14} />
        {phase === "rendering" ? "正在导出…" : "导出 MP4"}
      </button>
      {phase !== "idle" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => {
            if (phase !== "rendering") {
              setPhase("idle");
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {phase === "rendering" ? (
              <>
                <h3 className="font-display text-lg">正在浏览器里导出 MP4</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  用当前页面直接编码，完成后会自动下载。请保持标签页开着，不要切到后台。
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full bg-ink transition-[width]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs tabular-nums text-ink/45">
                  {encodedFrames} / {totalFrames} 帧
                </p>
                <button
                  type="button"
                  onClick={cancel}
                  className="mt-4 rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
                >
                  取消
                </button>
              </>
            ) : null}
            {phase === "done" ? (
              <>
                <h3 className="font-display text-lg">已开始下载</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  浏览器应已下载{" "}
                  <code className="rounded bg-paper px-1">{mp4Name}</code>。
                </p>
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className="mt-4 rounded-lg bg-ink px-3 py-1.5 text-sm text-paper"
                >
                  关闭
                </button>
              </>
            ) : null}
            {phase === "error" ? (
              <>
                <h3 className="font-display text-lg">浏览器导出失败</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  {error}。请换最新版 Chrome 再试。也可以在仓库根目录运行：
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-paper px-3 py-2 text-xs">
                  {renderCommand}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      downloadJson(jsonName, JSON.stringify(project, null, 2));
                      void navigator.clipboard
                        ?.writeText(renderCommand)
                        .catch(() => undefined);
                    }}
                    className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
                  >
                    下载 JSON 并复制命令
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("idle")}
                    className="rounded-lg bg-ink px-3 py-1.5 text-sm text-paper"
                  >
                    关闭
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
