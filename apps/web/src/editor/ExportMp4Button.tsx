import { Film } from "lucide-react";
import { useRef, useState } from "react";
import type { VideoProject } from "@ai-doodle/video-schema";
import { downloadBlob, downloadJson } from "../lib/local-project";
import {
  EXPORT_PRESETS,
  resolveExportSize,
  type ExportPresetId,
} from "../lib/export-presets";
import { pollCloudRender, startCloudRender } from "../lib/session";
import { useEditorStore } from "../stores/editor-store";
import { scaleProjectToSize } from "./project-edits";
import { renderProjectOnWeb } from "./render-on-web";

type ExportPhase = "idle" | "pick" | "rendering" | "done" | "error";

export function ExportMp4Button({ project }: { project: VideoProject }) {
  const persist = useEditorStore((state) => state.persist);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<ExportPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [encodedFrames, setEncodedFrames] = useState(0);
  const [presetId, setPresetId] = useState<ExportPresetId>("project");
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const size = resolveExportSize(project, presetId);
  const exportProject = scaleProjectToSize(project, size.width, size.height);
  const jsonName = `${project.id}.json`;
  const mp4Name = `${project.id}-${presetId}.mp4`;
  const totalFrames = Math.max(1, exportProject.durationInFrames);
  const percent = Math.min(99, Math.round((encodedFrames / totalFrames) * 100));
  const renderCommand = `pnpm render:json ./output/${jsonName}`;

  async function exportViaCloud() {
    setCloudStatus("正在提交云端渲染…");
    setPhase("rendering");
    try {
      const jobId = await startCloudRender(exportProject);
      for (;;) {
        const job = await pollCloudRender(jobId);
        if (job.status === "done" && job.output) {
          const file = job.output.split("/").pop() ?? `${project.id}.mp4`;
          window.location.href = `/api/output/${file}`;
          setPhase("done");
          setCloudStatus(null);
          return;
        }
        if (job.status === "error") {
          throw new Error(job.error || "云端渲染失败");
        }
        setCloudStatus("云端渲染进行中，请稍候…");
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "云端渲染失败");
      setPhase("error");
      setCloudStatus(null);
    }
  }

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
    setCloudStatus(null);

    try {
      const blob = await renderProjectOnWeb(exportProject, {
        signal: controller.signal,
        width: exportProject.width,
        height: exportProject.height,
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
        title="按平台预设导出 MP4"
        onClick={() => setPhase("pick")}
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
            {phase === "pick" ? (
              <>
                <h3 className="font-display text-lg">选择导出预设</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  会按目标尺寸等比缩放画面后再编码，不改动编辑器里的原项目。
                </p>
                <div className="mt-4 space-y-2">
                  {EXPORT_PRESETS.map((preset) => {
                    const active = preset.id === presetId;
                    const dims =
                      preset.id === "project"
                        ? `${project.width}×${project.height}`
                        : `${preset.width}×${preset.height}`;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setPresetId(preset.id)}
                        className={`flex w-full items-start justify-between rounded-xl border px-3 py-2.5 text-left ${
                          active
                            ? "border-ink bg-paper"
                            : "border-ink/10 hover:bg-paper"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium">{preset.label}</span>
                          <span className="mt-0.5 block text-xs text-ink/45">
                            {preset.blurb}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-ink/40">
                          {dims}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void exportMp4()}
                    className="rounded-lg bg-ink px-3 py-1.5 text-sm text-paper"
                  >
                    导出 {size.width}×{size.height}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("idle")}
                    className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
                  >
                    取消
                  </button>
                </div>
              </>
            ) : null}
            {phase === "rendering" ? (
              <>
                <h3 className="font-display text-lg">正在导出 MP4</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  {cloudStatus ??
                    `预设：${size.label}（${exportProject.width}×${exportProject.height}）。请保持标签页开着。`}
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
                    onClick={() => void exportViaCloud()}
                    className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm hover:bg-paper"
                  >
                    改用云端导出
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadJson(
                        jsonName,
                        JSON.stringify(exportProject, null, 2),
                      );
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
