import {
  EmptyScriptError,
  generateVideoProject,
  MAX_SCENES_SOFT,
  SCRIPT_TEMPLATES,
  splitScriptWithMeta,
  STYLE_OPTIONS,
} from "@ai-doodle/ai";
import { loadDemoProject, VideoComposition } from "@ai-doodle/renderer";
import type { VideoProject } from "@ai-doodle/video-schema";
import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppNav } from "../components/AppNav";
import { applyAspectRatio } from "../editor/project-edits";
import { saveProjectJson } from "../lib/local-project";
import { fetchServiceStatus } from "../lib/session";
import {
  attachTtsNarration,
  fetchTtsVoices,
  pickDefaultVoiceId,
  sortVoicesForLanguage,
  type TtsVoiceOption,
} from "../lib/tts";

const ASPECTS = ["9:16", "16:9", "1:1"] as const;

export function CreatePage() {
  const navigate = useNavigate();
  const [script, setScript] = useState("为什么美国长期制裁伊朗？");
  const [language, setLanguage] = useState("zh");
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [voice, setVoice] = useState("zh-CN-XiaoxiaoNeural");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("9:16");
  const [style, setStyle] = useState("whiteboard");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [preview, setPreview] = useState<VideoProject>(() =>
    applyAspectRatio(loadDemoProject(), "9:16"),
  );
  const [llmEnabled, setLlmEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchTtsVoices("all")
      .then((list) => {
        if (!cancelled) {
          setVoices(list);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setVoices([]);
          setError(
            cause instanceof Error
              ? `无法加载音色列表：${cause.message}（请确认 api 已启动）`
              : "无法加载音色列表",
          );
        }
      });
    void fetchServiceStatus()
      .then((info) => {
        if (!cancelled) {
          setLlmEnabled(info.llm);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (voices.length === 0) {
      return;
    }
    setVoice((current) =>
      voices.some((item) => item.id === current)
        ? current
        : pickDefaultVoiceId(voices, language),
    );
  }, [language, voices]);

  useEffect(() => {
    if (!script.trim()) {
      return;
    }
    const handle = window.setTimeout(() => {
      try {
        setPreview(
          generateVideoProject({
            script,
            language,
            voice,
            aspect,
            style,
          }),
        );
        setError(null);
      } catch (cause) {
        if (!(cause instanceof EmptyScriptError)) {
          setError(cause instanceof Error ? cause.message : "预览生成失败");
        }
      }
    }, 420);
    return () => window.clearTimeout(handle);
  }, [script, language, voice, aspect, style]);

  const voiceOptions = sortVoicesForLanguage(voices, language);

  async function handleGenerate() {
    setError(null);
    setWarning(null);
    setStatus(null);
    if (!script.trim()) {
      setError("请先输入文案");
      return;
    }
    setGenerating(true);
    try {
      const previewSplit = splitScriptWithMeta(script);
      setStatus(
        previewSplit.truncated
          ? `正在生成分镜（文案较长，将截断到 ${MAX_SCENES_SOFT} 镜）…`
          : `正在生成分镜（约 ${previewSplit.parts.length} 镜）…`,
      );
      let project: VideoProject = generateVideoProject({
        script,
        language,
        voice,
        aspect,
        style,
      });
      let source: "llm" | "heuristic" = "heuristic";
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script, language, voice, aspect, style }),
        });
        const payload = (await response.json()) as {
          project?: VideoProject;
          source?: "llm" | "heuristic";
          error?: string;
        };
        if (response.ok && payload.project) {
          project = payload.project;
          source = payload.source ?? "heuristic";
        }
      } catch {
        source = "heuristic";
      }
      setPreview(project);
      setStatus(source === "llm" ? "正在按分镜合成旁白…" : "正在合成旁白语音…");
      try {
        project = await attachTtsNarration(project, {
          voice,
          language,
        });
        setPreview(project);
      } catch (ttsError) {
        setWarning(
          ttsError instanceof Error
            ? `分镜已生成，但语音合成失败：${ttsError.message}。可以稍后在编辑器里重试，不会使用占位音。`
            : "分镜已生成，但语音合成失败。可以稍后在编辑器里重试。",
        );
      }

      saveProjectJson(project.id, JSON.stringify(project));
      navigate(`/editor/${project.id}`);
    } catch (cause) {
      if (cause instanceof EmptyScriptError) {
        setError(cause.message);
      } else {
        setError(cause instanceof Error ? cause.message : "生成分镜失败，请稍后再试");
      }
    } finally {
      setGenerating(false);
      setStatus(null);
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-8 text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
        <section className="max-w-xl">
          <AppNav current="create" />
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/45">
            文案进，可编辑白板工程出
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            把文案变成白板手绘视频
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink/55">
            右侧会跟着文案实时预览分镜。点「生成视频」会调用
            {llmEnabled ? " LLM 分镜" : " 规则分镜"}
            并合成旁白，然后进入可改每一场的编辑器。
          </p>

          <div className="mt-6">
            <p className="mb-2 text-sm">从模板开始</p>
            <div className="grid grid-cols-2 gap-2">
              {SCRIPT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setScript(template.script);
                    setLanguage(template.language);
                    setAspect(template.aspect);
                    setStyle(template.style);
                    setError(null);
                    setWarning(null);
                  }}
                  className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-left hover:border-cobalt/40"
                >
                  <span className="block text-sm font-medium">{template.label}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-ink/45">
                    {template.blurb}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm">文案</span>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              rows={7}
              className="w-full resize-y rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-cobalt"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <SelectField
              label="语言"
              value={language}
              onChange={setLanguage}
              options={[
                ["zh", "中文"],
                ["en", "English"],
              ]}
            />
            <SelectField
              label={`声音${voiceOptions.length > 0 ? `（${voiceOptions.length}）` : ""}`}
              value={voice}
              onChange={setVoice}
              options={
                voiceOptions.length > 0
                  ? voiceOptions.map((item) => [item.id, item.label])
                  : [[voice, "加载中…"]]
              }
            />
            <SelectField
              label="比例"
              value={aspect}
              onChange={(value) => setAspect(value as (typeof ASPECTS)[number])}
              options={ASPECTS.map((item) => [item, item])}
            />
            <SelectField
              label="风格"
              value={style}
              onChange={setStyle}
              options={STYLE_OPTIONS}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm text-paper disabled:bg-ink/20 disabled:text-white"
            >
              {generating ? status || "正在生成…" : "生成视频"}
            </button>
            <button
              type="button"
              onClick={() => {
                saveProjectJson(preview.id, JSON.stringify(preview));
                navigate(`/editor/${preview.id}`);
              }}
              className="rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink"
            >
              用当前预览打开编辑器
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-xs leading-5 text-red-700">{error}</p>
          ) : warning ? (
            <p className="mt-3 text-xs leading-5 text-amber-700">{warning}</p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-ink/45">
              {llmEnabled
                ? "已检测到 LLM_API_KEY，生成时会走模型分镜，失败则回退规则引擎。"
                : "未配置 LLM_API_KEY 时使用规则分镜。配音需要本机 API；失败不会塞占位音。"}
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-ink/10 bg-black">
          <Player
            component={VideoComposition}
            inputProps={{ project: preview }}
            durationInFrames={preview.durationInFrames}
            fps={preview.fps}
            compositionWidth={preview.width}
            compositionHeight={preview.height}
            controls
            autoPlay={false}
            style={{
              width: "100%",
              aspectRatio: `${preview.width} / ${preview.height}`,
            }}
          />
        </section>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-cobalt"
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
