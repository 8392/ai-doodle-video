import { getAsset } from "@ai-doodle/asset-library";
import { findElement, findScene } from "./project-edits";
import { useEditorStore } from "../stores/editor-store";

export function PropertiesPanel() {
  const project = useEditorStore((state) => state.project);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const patchElement = useEditorStore((state) => state.patchElement);

  if (!project) {
    return null;
  }

  const scene = findScene(project, selectedSceneId);
  const element = findElement(project, selectedElementId);

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
          属性
        </p>
        <h2 className="mt-2 font-display text-lg">{scene?.id ?? "未选择场景"}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="mb-2 text-xs text-ink/45">当前 Scene 元素</p>
        <ul className="space-y-1">
          {scene?.elements.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => selectElement(item.id)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-sm ${
                  item.id === selectedElementId
                    ? "border-ink bg-paper"
                    : "border-transparent hover:bg-paper"
                }`}
              >
                {getAsset(item.assetId ?? "")?.name ?? item.id}
              </button>
            </li>
          ))}
        </ul>

        {element ? (
          <div className="mt-5 space-y-3">
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
          <p className="mt-6 text-sm text-ink/45">选择一个元素后可调整位置和缩放。</p>
        )}
      </div>
    </aside>
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
