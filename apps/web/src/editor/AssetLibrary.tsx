import { searchAssets, type AssetCategory, type AssetDefinition } from "@ai-doodle/asset-library";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useEditorStore } from "../stores/editor-store";

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  country: "国家",
  people: "人物",
  economy: "经济",
  industry: "工业",
  objects: "物体",
  politics: "政治",
  hands: "手",
};

export function AssetLibrary() {
  const addAsset = useEditorStore((state) => state.addAsset);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory | "all">("all");

  const results = useMemo(() => {
    const found = searchAssets(query);
    if (category === "all") {
      return found;
    }
    return found.filter((asset) => asset.category === category);
  }, [query, category]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
          素材库
        </p>
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-ink/10 bg-paper px-2.5 py-2">
          <Search size={14} className="text-ink/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 美国 / 石油"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <CategoryChip
            active={category === "all"}
            label="全部"
            onClick={() => setCategory("all")}
          />
          {(Object.keys(CATEGORY_LABEL) as AssetCategory[]).map((key) => (
            <CategoryChip
              key={key}
              active={category === key}
              label={CATEGORY_LABEL[key]}
              onClick={() => setCategory(key)}
            />
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {results.length === 0 ? (
          <p className="px-1 text-sm text-ink/45">没有匹配的素材，换个关键词试试。</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {results.map((asset) => (
              <li key={asset.id}>
                <AssetCard asset={asset} onAdd={() => addAsset(asset)} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 px-1 text-[11px] leading-5 text-ink/40">
          点击素材会加入当前 Scene。手绘描边只对 SVG 生效。
        </p>
      </div>
    </aside>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[11px] ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-ink/10 text-ink/60 hover:border-ink/30"
      }`}
    >
      {label}
    </button>
  );
}

function AssetCard({
  asset,
  onAdd,
}: {
  asset: AssetDefinition;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-ink/10 bg-paper text-left transition hover:border-cobalt/50 hover:bg-white"
    >
      <div className="flex h-20 items-center justify-center bg-white p-2">
        <img
          src={asset.src}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <span className="truncate px-2 py-1.5 text-xs text-ink/80 group-hover:text-ink">
        {asset.name}
      </span>
    </button>
  );
}
