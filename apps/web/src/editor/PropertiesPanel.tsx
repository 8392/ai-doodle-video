import { getAsset } from "@ai-doodle/asset-library";
import { applyMusic, MUSIC_TRACKS } from "@ai-doodle/ai";
import { DEFAULT_TRANSITION } from "@ai-doodle/renderer";
import type {
  AnimationType,
  TransitionConfig,
  TransitionType,
} from "@ai-doodle/video-schema";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { findElement, findScene } from "./project-edits";
import {
  attachSceneTts,
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

const ANIMATION_TYPES: { id: AnimationType; label: string }[] = [
  { id: "draw", label: "描画" },
  { id: "fade", label: "淡入" },
  { id: "pop", label: "弹出" },
  { id: "slide-left", label: "左滑" },
  { id: "slide-right", label: "右滑" },
  { id: "slide-up", label: "上滑" },
  { id: "slide-down", label: "下滑" },
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
  const setMusic = useEditorStore((state) => state.setMusic);
  const patchDrawing = useEditorStore((state) => state.patchDrawing);

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
            cameraX={scene.camera?.x ?? 0}
            cameraY={scene.camera?.y ?? 0}
            cameraScale={scene.camera?.scale ?? 1}
            cameraDuration={scene.camera?.durationInFrames ?? scene.durationInFrames}
            onChange={patchScene}
            onRegenerateSpeech={async (voiceId) => {
              const next = await attachTtsNarration(project, {
                voice: voiceId,
                language: project.language,
              });
              replaceProject(next);
              persist();
            }}
            onRegenerateScene={async () => {
              const response = await fetch("/api/generate/scene", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  project,
                  sceneId: scene.id,
                  narration: scene.narration,
                }),
              });
              const payload = (await response.json()) as {
                project?: typeof project;
                error?: string;
              };
              if (!response.ok || !payload.project) {
                throw new Error(payload.error || "重生这一场失败");
              }
              replaceProject(payload.project);
              persist();
            }}
            onRegenerateSceneSpeech={async (voiceId) => {
              const next = await attachSceneTts(project, scene.id, {
                voice: voiceId,
                language: project.language,
              });
              replaceProject(next);
              persist();
            }}
          />
        ) : null}

        <MusicSettings
          currentSrc={project.music?.src}
          onChange={(trackId) => setMusic(applyMusic(project, trackId).music)}
        />

        <DrawingSettings
          handEnabled={project.drawing?.handEnabled !== false}
          defaultAnimation={project.drawing?.defaultAnimation ?? "draw"}
          onChange={patchDrawing}
        />

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
                {elementLabel(item)}
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
                {elementLabel(element)}
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
            <NumberField
              label="rotation"
              value={element.rotation ?? 0}
              onChange={(value) => patchElement({ rotation: value })}
            />
            {element.type === "text" ? (
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-ink/40">
                  文字
                </span>
                <textarea
                  rows={2}
                  value={element.text ?? ""}
                  onChange={(event) => patchElement({ text: event.target.value })}
                  className="w-full rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-ink/40">
                动画
              </span>
              <select
                value={element.animation?.type ?? "draw"}
                onChange={(event) =>
                  patchElement({
                    animation: {
                      type: event.target.value as AnimationType,
                      durationInFrames: element.animation?.durationInFrames ?? 36,
                      easing: element.animation?.easing,
                    },
                  })
                }
                className="w-full rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
              >
                {ANIMATION_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {(element.animation?.type ?? "draw") === "draw" ? (
              <label className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-2.5 py-2 text-sm">
                <span>显示画手</span>
                <input
                  type="checkbox"
                  checked={element.showHand !== false}
                  onChange={(event) =>
                    patchElement({ showHand: event.target.checked })
                  }
                />
              </label>
            ) : null}
            <NumberField
              label="动画时长 (帧)"
              value={element.animation?.durationInFrames ?? 36}
              onChange={(value) =>
                patchElement({
                  animation: {
                    type: element.animation?.type ?? "draw",
                    durationInFrames: Math.max(1, value),
                    easing: element.animation?.easing,
                  },
                })
              }
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
  cameraX,
  cameraY,
  cameraScale,
  cameraDuration,
  onChange,
  onRegenerateSpeech,
  onRegenerateScene,
  onRegenerateSceneSpeech,
}: {
  fps: number;
  language: string;
  projectId: string;
  durationInFrames: number;
  narration: string;
  cameraX: number;
  cameraY: number;
  cameraScale: number;
  cameraDuration: number;
  onChange: (patch: {
    durationInFrames?: number;
    narration?: string;
    camera?: { x: number; y: number; scale: number; durationInFrames: number; easing?: string };
  }) => void;
  onRegenerateSpeech: (voiceId: string) => Promise<void>;
  onRegenerateScene: () => Promise<void>;
  onRegenerateSceneSpeech: (voiceId: string) => Promise<void>;
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
      <select
        value={voice}
        onChange={(event) => setVoice(event.target.value)}
        className="w-full rounded-lg border border-ink/10 bg-paper px-2 py-1.5 text-sm outline-none focus:border-cobalt"
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
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || voiceOptions.length === 0}
          onClick={() => {
            setBusy(true);
            setMessage(null);
            void onRegenerateSpeech(voice)
              .then(() => setMessage("整片旁白已按真实时长对齐"))
              .catch((error: unknown) =>
                setMessage(error instanceof Error ? error.message : "合成失败"),
              )
              .finally(() => setBusy(false));
          }}
          className="w-full shrink-0 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-sm text-paper disabled:bg-ink/30"
        >
          {busy ? "合成中…" : "生成整片旁白"}
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setMessage(null);
              void onRegenerateSceneSpeech(voice)
                .then(() => setMessage("本场旁白已更新"))
                .catch((error: unknown) =>
                  setMessage(error instanceof Error ? error.message : "合成失败"),
                )
                .finally(() => setBusy(false));
            }}
            className="min-w-0 flex-1 whitespace-nowrap rounded-lg border border-ink/10 px-3 py-1.5 text-xs"
          >
            只合成本场
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setMessage(null);
              void onRegenerateScene()
                .then(() => setMessage("本场画面已重生"))
                .catch((error: unknown) =>
                  setMessage(error instanceof Error ? error.message : "重生失败"),
                )
                .finally(() => setBusy(false));
            }}
            className="min-w-0 flex-1 whitespace-nowrap rounded-lg border border-ink/10 px-3 py-1.5 text-xs"
          >
            重生这一场
          </button>
        </div>
      </div>
      <p className="text-[11px] leading-4 text-ink/40">
        整片合成会按每场旁白时长对齐时间轴（{language} / {projectId}）。
      </p>
      <NumberField
        label="镜头 x"
        value={cameraX}
        onChange={(value) =>
          onChange({
            camera: {
              x: value,
              y: cameraY,
              scale: cameraScale,
              durationInFrames: cameraDuration,
              easing: "ease-in-out",
            },
          })
        }
      />
      <NumberField
        label="镜头 y"
        value={cameraY}
        onChange={(value) =>
          onChange({
            camera: {
              x: cameraX,
              y: value,
              scale: cameraScale,
              durationInFrames: cameraDuration,
              easing: "ease-in-out",
            },
          })
        }
      />
      <NumberField
        label="镜头 scale"
        value={cameraScale}
        step={0.02}
        onChange={(value) =>
          onChange({
            camera: {
              x: cameraX,
              y: cameraY,
              scale: Math.max(0.5, value),
              durationInFrames: cameraDuration,
              easing: "ease-in-out",
            },
          })
        }
      />
      <NumberField
        label="镜头动画帧"
        value={cameraDuration}
        onChange={(value) =>
          onChange({
            camera: {
              x: cameraX,
              y: cameraY,
              scale: cameraScale,
              durationInFrames: Math.max(1, value),
              easing: "ease-in-out",
            },
          })
        }
      />
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

function elementLabel(item: {
  type: string;
  text?: string;
  assetId?: string;
  src?: string;
  id: string;
}): string {
  if (item.type === "text") {
    return item.text?.trim() || "文字";
  }
  if (item.type === "arrow") {
    return "箭头";
  }
  if (item.type === "shape") {
    return "形状";
  }
  if (item.type === "image" || item.type === "svg") {
    return getAsset(item.assetId ?? "")?.name ?? (item.src ? "上传图片" : "图片");
  }
  return getAsset(item.assetId ?? "")?.name ?? item.id;
}

function DrawingSettings({
  handEnabled,
  defaultAnimation,
  onChange,
}: {
  handEnabled: boolean;
  defaultAnimation: "draw" | "fade" | "pop";
  onChange: (drawing: {
    handEnabled: boolean;
    defaultAnimation: "draw" | "fade" | "pop";
  }) => void;
}) {
  return (
    <div className="mb-5 space-y-2 border-b border-ink/10 pb-4">
      <p className="text-xs text-ink/45">手绘模式</p>
      <label className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-2.5 py-2 text-sm">
        <span>显示画手</span>
        <input
          type="checkbox"
          checked={handEnabled}
          onChange={(event) =>
            onChange({
              handEnabled: event.target.checked,
              defaultAnimation,
            })
          }
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-ink/40">
          新图标默认出现方式
        </span>
        <select
          value={defaultAnimation}
          onChange={(event) =>
            onChange({
              handEnabled,
              defaultAnimation: event.target.value as "draw" | "fade" | "pop",
            })
          }
          className="w-full rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
        >
          <option value="draw">手绘描画</option>
          <option value="fade">淡入</option>
          <option value="pop">弹出</option>
        </select>
      </label>
    </div>
  );
}

function MusicSettings({
  currentSrc,
  onChange,
}: {
  currentSrc?: string;
  onChange: (trackId: string | undefined) => void;
}) {
  const selected =
    MUSIC_TRACKS.find((track) => track.src === currentSrc)?.id ?? "";
  return (
    <div className="mb-5 space-y-2 border-b border-ink/10 pb-4">
      <p className="text-xs text-ink/45">背景音乐</p>
      <select
        value={selected}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="w-full rounded-lg border border-ink/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-cobalt"
      >
        <option value="">无配乐</option>
        {MUSIC_TRACKS.map((track) => (
          <option key={track.id} value={track.id}>
            {track.name}
          </option>
        ))}
      </select>
    </div>
  );
}
