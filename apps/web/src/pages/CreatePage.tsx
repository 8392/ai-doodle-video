import {
  EmptyScriptError,
  generateVideoProject,
  MAX_SCENES_SOFT,
  splitScriptWithMeta,
} from "@ai-doodle/ai";
import { loadDemoProject, VideoComposition } from "@ai-doodle/renderer";
import { Player } from "@remotion/player";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyAspectRatio } from "../editor/project-edits";
import { saveProjectJson } from "../lib/local-project";
import { attachTtsNarration } from "../lib/tts";

const ASPECTS = ["9:16", "16:9", "1:1"] as const;

export function CreatePage() {
  const navigate = useNavigate();
  const [script, setScript] = useState("为什么美国长期制裁伊朗？");
  const [language, setLanguage] = useState("zh");
  const [voice, setVoice] = useState("female");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("9:16");
  const [style, setStyle] = useState("whiteboard");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () => applyAspectRatio(loadDemoProject(), aspect),
    [aspect],
  );

  async function handleGenerate() {
    setError(null);
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
      await wait(300);
      let project = generateVideoProject({
        script,
        language,
        voice,
        aspect,
        style,
      });

      setStatus("正在合成旁白语音…");
      try {
        project = await attachTtsNarration(project, {
          voice,
          language,
          fileId: `${project.id}-narration-${Date.now().toString(36)}`,
        });
      } catch (ttsError) {
        setStatus(
          ttsError instanceof Error
            ? `分镜已生成，但语音合成失败：${ttsError.message}（仍使用占位音轨）`
            : "分镜已生成，但语音合成失败（仍使用占位音轨）",
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
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/45">
            Phase 3 · Mock storyboard + TTS
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            把文案变成白板手绘视频
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink/55">
            「生成视频」会按句号/逗号把长文案拆成多镜（单镜约 30
            字内），再合成旁白语音写入时间轴。短文至少 3
            镜；特别长的文案最多 {MAX_SCENES_SOFT} 镜。
          </p>

          <label className="mt-8 block">
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
              label="声音"
              value={voice}
              onChange={setVoice}
              options={[
                ["female", "女声"],
                ["male", "男声"],
              ]}
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
              options={[["whiteboard", "白板手绘"]]}
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
                const project = {
                  ...applyAspectRatio(loadDemoProject(), aspect),
                  id: "demo",
                  language,
                };
                saveProjectJson(project.id, JSON.stringify(project));
                navigate("/editor/demo");
              }}
              className="rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink"
            >
              打开编辑器
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-xs leading-5 text-red-700">{error}</p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-ink/45">
              语音合成需要本机 `pnpm dev` 在线；失败时会回退到占位
              demo.wav。「打开编辑器」仍加载 demo。
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
