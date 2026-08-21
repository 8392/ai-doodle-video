import { searchAssets, type AssetCategory, type AssetDefinition } from "@ai-doodle/asset-library";
import type { UserAsset } from "@ai-doodle/video-schema";
import { Search, Type, MoveRight, Square, Upload, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { setAssetDragData } from "./drag-drop";
import { uploadAssetFile } from "../lib/session";
import {
  guessUploadType,
  loadUserGallery,
  removeUserGalleryItem,
  upsertUserGalleryItem,
} from "../lib/user-gallery";
import { useEditorStore } from "../stores/editor-store";

const CATEGORY_LABEL: Partial<Record<AssetCategory, string>> = {
  country: "国家",
  people: "人物",
  economy: "经济",
  industry: "工业",
  history: "历史",
  military: "军事",
  diplomacy: "外交",
  politics: "政治",
  media: "传媒",
  objects: "地理",
  science: "科学",
  education: "教育",
  tech: "科技",
  symbols: "符号",
  hands: "手",
};

type LibraryTab = "official" | "mine";

export function AssetLibrary() {
  const addAsset = useEditorStore((state) => state.addAsset);
  const addPrimitive = useEditorStore((state) => state.addPrimitive);
  const addImageSrc = useEditorStore((state) => state.addImageSrc);
  const [tab, setTab] = useState<LibraryTab>("official");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<UserAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGallery(loadUserGallery());
  }, []);

  const results = useMemo(() => {
    const found = searchAssets(query);
    if (category === "all") {
      return found.filter((asset) => asset.category !== "hands");
    }
    return found.filter((asset) => asset.category === category);
  }, [query, category]);

  const mine = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return gallery;
    }
    return gallery.filter((item) => item.name.toLowerCase().includes(needle));
  }, [gallery, query]);

  async function handleUpload(files: File[]) {
    if (files.length === 0) {
      return;
    }
    const project = useEditorStore.getState().project;
    const selectedSceneId = useEditorStore.getState().selectedSceneId;
    if (!project || !selectedSceneId) {
      setUploadError("请先打开一个项目，再上传图片");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const uploaded = await uploadAssetFile(file);
        const type = guessUploadType(uploaded.name || uploaded.src);
        const item: UserAsset = {
          id: uploaded.id,
          name: uploaded.name,
          src: uploaded.src,
          type,
          createdAt: Date.now(),
        };
        setGallery(upsertUserGalleryItem(item));
        addImageSrc(uploaded.src, {
          id: uploaded.id,
          name: uploaded.name,
          type,
        });
      }
      setTab("mine");
    } catch (cause: unknown) {
      setUploadError(cause instanceof Error ? cause.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <aside className="flex h-full w-[260px] min-h-0 shrink-0 flex-col border-r border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">
          素材库
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-ink/10 p-1">
          <TabChip active={tab === "official"} label="官方库" onClick={() => setTab("official")} />
          <TabChip active={tab === "mine"} label="我的图库" onClick={() => setTab("mine")} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          <ToolButton label="文字" onClick={() => addPrimitive("text")}>
            <Type size={14} />
          </ToolButton>
          <ToolButton label="箭头" onClick={() => addPrimitive("arrow")}>
            <MoveRight size={14} />
          </ToolButton>
          <ToolButton label="形状" onClick={() => addPrimitive("shape")}>
            <Square size={14} />
          </ToolButton>
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-ink/10 py-1.5 text-[10px] text-ink/70 hover:bg-paper">
            <Upload size={14} />
            {uploading ? "上传中" : "上传"}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg,.png,.jpg,.jpeg,.webp"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const picked = event.target.files
                  ? Array.from(event.target.files)
                  : [];
                event.target.value = "";
                void handleUpload(picked);
              }}
            />
          </label>
        </div>
        {uploadError ? (
          <p className="mt-2 text-[11px] text-red-600">{uploadError}</p>
        ) : null}
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-ink/10 bg-paper px-2.5 py-2">
          <Search size={14} className="text-ink/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === "mine" ? "搜索我的图片" : "搜索 法国 / 坦克 / 芯片"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
          />
        </label>
        {tab === "official" ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <CategoryChip
              active={category === "all"}
              label="全部"
              onClick={() => setCategory("all")}
            />
            {(Object.keys(CATEGORY_LABEL) as AssetCategory[])
              .filter((key) => key !== "hands")
              .map((key) => (
                <CategoryChip
                  key={key}
                  active={category === key}
                  label={CATEGORY_LABEL[key] ?? key}
                  onClick={() => setCategory(key)}
                />
              ))}
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "official" ? (
          results.length === 0 ? (
            <p className="px-1 text-sm text-ink/45">没有匹配的素材，换个关键词试试。</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {results.map((asset) => (
                <li key={asset.id}>
                  <AssetCard asset={asset} onAdd={() => addAsset(asset)} />
                </li>
              ))}
            </ul>
          )
        ) : mine.length === 0 ? (
          <div className="px-1">
            <p className="text-sm text-ink/45">
              还没有上传图片。点上方「上传」，或点这里选择文件。
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm text-ink/80 hover:border-cobalt/40">
              <Upload size={14} />
              选择图片上传
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg,.png,.jpg,.jpeg,.webp"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const picked = event.target.files
                    ? Array.from(event.target.files)
                    : [];
                  event.target.value = "";
                  void handleUpload(picked);
                }}
              />
            </label>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {mine.map((item) => (
              <li key={item.id}>
                <UserAssetCard
                  item={item}
                  onAdd={() =>
                    addImageSrc(item.src, {
                      id: item.id,
                      name: item.name,
                      type: item.type,
                    })
                  }
                  onRemove={() => setGallery(removeUserGalleryItem(item.id))}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 px-1 text-[11px] leading-5 text-ink/40">
          {tab === "official"
            ? "拖动素材到右侧视频区域指定位置；点击也会加入当前 Scene。"
            : "点选加入当前场；删除只影响图库列表，不会移除已放入场景的元素。"}
        </p>
      </div>
    </aside>
  );
}

function TabChip({
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
      className={`rounded-md px-2 py-1.5 text-xs ${
        active ? "bg-ink text-paper" : "text-ink/60 hover:bg-paper"
      }`}
    >
      {label}
    </button>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg border border-ink/10 py-1.5 text-[10px] text-ink/70 hover:bg-paper"
    >
      {children}
      {label}
    </button>
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
      draggable
      onDragStart={(event) => {
        setAssetDragData(event.dataTransfer, asset.id);
      }}
      onClick={onAdd}
      className="group flex w-full cursor-grab flex-col overflow-hidden rounded-xl border border-ink/10 bg-paper text-left transition hover:border-cobalt/50 hover:bg-white active:cursor-grabbing"
    >
      <div className="flex h-20 items-center justify-center bg-white p-2">
        <img
          src={asset.src}
          alt=""
          draggable={false}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <span className="truncate px-2 py-1.5 text-xs text-ink/80 group-hover:text-ink">
        {asset.name}
      </span>
    </button>
  );
}

function UserAssetCard({
  item,
  onAdd,
  onRemove,
}: {
  item: UserAsset;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink/10 bg-paper">
      <button type="button" onClick={onAdd} className="flex w-full flex-col text-left">
        <div className="flex h-20 items-center justify-center bg-white p-2">
          <img
            src={item.src}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <span className="truncate px-2 py-1.5 text-xs text-ink/80">{item.name}</span>
      </button>
      <button
        type="button"
        title="从图库删除"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-ink/45 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
