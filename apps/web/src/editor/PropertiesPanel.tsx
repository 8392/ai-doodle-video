import { getAsset } from "@ai-doodle/asset-library";
import { DEFAULT_TRANSITION } from "@ai-doodle/renderer";
import type { TransitionConfig, TransitionType } from "@ai-doodle/video-schema";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { findElement, findScene } from "./project-edits";
import {
  attachTtsNarration,
  fetchTtsVoices,
  pickDefaultVoiceId,
  sortVoicesForLanguage,
  type TtsVoiceOption,
} from "../lib/tts";
import { useEditorStore } from "../stores/editor-store";

const TRANSITION_TYPES: { id: TransitionType; label: string }[] = [
  { id: "none", label: "无" },
  { id: "fade", label: "淡入淡出" },
  { id: "slide-left", label: "向左滑入" },
  { id: "slide-right", label: "向右滑入" },
  { id: "slide-up", label: "向上滑入" },
  { id: "slide-down", label: "向下滑入" },
];

export function PropertiesPanel() {
  const project = useEditorStore((state) => state.project);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const patchElement = useEditorStore((state) => state.patchElement);
  const patchDefaultTransition = useEditorStore((state) => state.patchDefaultTransition);
  const patchSceneTransition = useEditorStore((state) => state.patchSceneTransition);
  const patchScene = useEditorStore((state) => state.patchScene);
  const reorderElement = useEditorStore((state) => state.reorderElement);
  const removeSelectedElement = useEditorStore((state) => state.removeSelectedElement);
  const replaceProject = useEditorStore((state) => state.replaceProject);
  const persist = useEditorStore((state) => state.persist);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (!useEditorStore.getState().selectedElementId) {
        return;
      }
      event.preventDefault();
      removeSelectedElement();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [removeSelectedElement]);

  if (!project) {
    return null;
  }

  const scene = findScene(project, selectedSceneId);
  const element = findElement(project, selectedElementId);

  return (
    <aside className="flex h-full w-[280px] min-h-0 shrink-0 flex-col border-l border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
          属性
        </p>
        <h2 className="mt-2 font-display text-lg">{scene?.id ?? "未选择场景"}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {scene ? (
          <SceneSettings
            fps={project.fps}
            language={project.language}
            projectId={project.id}
            durationInFrames={scene.durationInFrames}
            narration={scene.narration ?? ""}
            onChange={patchScene}
            onRegenerateSpeech={async (voiceId) => {
              const next = await attachTtsNarration(project, {
                voice: voiceId,
                language: project.language,
                fileId: `${project.id}-narration-${Date.now().toString(36)}`,
              });
              replaceProject(next);
              persist();
            }}
          />
        ) : null}

        <TransitionSettings
          projectDefault={project.defaultTransition}
          sceneTransition={scene?.transition}
          onChangeDefault={patchDefaultTransition}
          onChangeScene={patchSceneTransition}
        />

        <p className="mb-2 mt-5 text-xs text-ink/45">当前 Scene 元素（上到下 = 播放先后）</p>
        <ul className="space-y-1">
          {scene?.elements.map((item, index) => (
            <li key={item.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectElement(item.id)}
                className={`min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-left text-sm ${
                  item.id === selectedElementId
                    ? "border-ink bg-paper"
                    : "border-transparent hover:bg-paper"
                }`}
              >
                {getAsset(item.assetId ?? "")?.name ?? item.id}
              </button>
              <button
                type="button"
                title="上移（更早描边）"
                disabled={index === 0}
                onClick={() => reorderElement(item.id, -1)}
                className="rounded-md p-1 text-ink/45 hover:bg-paper hover:text-ink disabled:opacity-30"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                title="下移（更晚描边）"
                disabled={index === scene.elements.length - 1}
                onClick={() => reorderElement(item.id, 1)}
                className="rounded-md p-1 text-ink/45 hover:bg-paper hover:text-ink disabled:opacity-30"
              >
                <ChevronDown size={14} />
              </button>
            </li>
          ))}
        </ul>

        {element ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {getAsset(element.assetId ?? "")?.name ?? element.id}
              </p>
              <button
                type="button"
                onClick={removeSelectedElement}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} />
                删除
              </button>
            </div>
            <NumberField
              label="x"
              value={element.x}
              onChange={(value) => patchElement({ x: value })}
            />
            <NumberField
              label="y"
              value={element.y}
              onChange={(value) => patchElement({ y: value })}
            />
            <NumberField
              label="scale"
              value={element.scale ?? 1}
              step={0.05}
              onChange={(value) => patchElement({ scale: Math.max(0.05, value) })}
            />
            <NumberField
              label="width"
              value={element.width ?? 320}
              onChange={(value) => patchElement({ width: Math.max(1, value) })}
            />
            <NumberField
              label="height"
              value={element.height ?? 320}
              onChange={(value) => patchElement({ height: Math.max(1, value) })}
            />
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink/45">
            在预览中点击图标选中，拖动手柄改大小，拖图标改位置。按住 Shift 等比缩放。
          </p>
        )}
      </div>
    </aside>
  );
}

function SceneSettings({
  fps,
  language,
  projectId,
  durationInFrames,
  narration,
  onChange,
  onRegenerateSpeech,
}: {
  fps: number;
  language: string;
  projectId: string;
  durationInFrames: number;
  narration: string;
  onChange: (patch: { durationInFrames?: number; narration?: string }) => void;
  onRegenerateSpeech: (voiceId: string) => Promise<void>;
}) {
  const seconds = Number((durationInFrames / fps).toFixed(2));
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [voice, setVoice] = useState("zh-CN-XiaoxiaoNeural");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchTtsVoices("all")
      .then((list) => {
        if (cancelled) {
          return;
        }
        setVoices(list);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setVoices([]);
          setMessage(
            cause instanceof Error
              ? `无法加载音色：${cause.message}`
              : "无法加载音色",
          );
        }
      });
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

  const voiceOptions = sortVoicesForLanguage(voices, language);

  return (
    <div className="mb-5 space-y-3 border-b border-ink/10 pb-4">
      <p className="text-xs text-ink/45">当前画布</p>
      <NumberField
        label="时长 (秒)"
        value={seconds}
        step={0.1}
        onChange={(value) =>
          onChange({ durationInFrames: Math.max(1, Math.round(value * fps)) })
        }
      />
      <NumberField
        label="时长 (帧)"
        value={durationInFrames}
        onChange={(value) => onChange({ durationInFrames: Math.max(1, value) })}
      />
      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-ink/40">
          旁白文案
        </span>
        <textarea
          rows={3}
          value={narration}
          onChange={(event) => onChange({ narration: event.target.value })}
          className="w-full resize-none rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
        />
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={voice}
          onChange={(event) => setVoice(event.target.value)}
          className="rounded-lg border border-ink/10 bg-paper px-2 py-1.5 text-sm outline-none focus:border-cobalt"
        >
          {voiceOptions.length > 0 ? (
            voiceOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))
          ) : (
            <option value={voice}>加载中…</option>
          )}
        </select>
        <button
          type="button"
          disabled={busy || voiceOptions.length === 0}
          onClick={() => {
            setBusy(true);
            setMessage(null);
            void onRegenerateSpeech(voice)
              .then(() => setMessage("旁白语音已更新"))
              .catch((error: unknown) =>
                setMessage(error instanceof Error ? error.message : "合成失败"),
              )
              .finally(() => setBusy(false));
          }}
          className="rounded-lg bg-ink px-3 py-1.5 text-sm text-paper disabled:bg-ink/30"
        >
          {busy ? "合成中…" : "生成旁白"}
        </button>
      </div>
      <p className="text-[11px] leading-4 text-ink/40">
        会用整片各 Scene 旁白合成一条音轨（{language} / {projectId}），并按字数重排时长。
      </p>
      {message ? (
        <p className="text-[11px] leading-4 text-ink/60">{message}</p>
      ) : null}
    </div>
  );
}

function TransitionSettings({
  projectDefault,
  sceneTransition,
  onChangeDefault,
  onChangeScene,
}: {
  projectDefault: TransitionConfig | undefined;
  sceneTransition: TransitionConfig | undefined;
  onChangeDefault: (transition: TransitionConfig) => void;
  onChangeScene: (transition: TransitionConfig | undefined) => void;
}) {
  const globalTransition = projectDefault ?? DEFAULT_TRANSITION;
  const usesGlobal = !sceneTransition;
  const sceneValue = sceneTransition ?? globalTransition;

  return (
    <div className="space-y-4 border-b border-ink/10 pb-4">
      <div>
        <p className="mb-2 text-xs text-ink/45">全局切换动画</p>
        <TransitionFields
          value={globalTransition}
          onChange={onChangeDefault}
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs text-ink/45">当前页切换动画</p>
          <label className="flex items-center gap-1.5 text-[11px] text-ink/55">
            <input
              type="checkbox"
              checked={usesGlobal}
              onChange={(event) => {
                if (event.target.checked) {
                  onChangeScene(undefined);
                  return;
                }
                onChangeScene({ ...globalTransition });
              }}
            />
            跟随全局
          </label>
        </div>
        <TransitionFields
          value={sceneValue}
          disabled={usesGlobal}
          onChange={onChangeScene}
        />
      </div>
    </div>
  );
}

function TransitionFields({
  value,
  onChange,
  disabled = false,
}: {
  value: TransitionConfig;
  onChange: (transition: TransitionConfig) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`space-y-2 ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-ink/40">
          效果
        </span>
        <select
          disabled={disabled}
          value={value.type}
          onChange={(event) =>
            onChange({ ...value, type: event.target.value as TransitionType })
          }
          className="w-full rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
        >
          {TRANSITION_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <NumberField
        label="时长 (帧)"
        value={value.durationInFrames}
        onChange={(durationInFrames) =>
          onChange({ ...value, durationInFrames: Math.max(1, durationInFrames) })
        }
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-ink/40">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
      />
    </label>
  );
}
