export const ASSET_DRAG_PREFIX = "ai-doodle-asset:";

export function setAssetDragData(dataTransfer: DataTransfer, assetId: string): void {
  dataTransfer.setData("text/plain", `${ASSET_DRAG_PREFIX}${assetId}`);
  dataTransfer.effectAllowed = "copy";
}

export function readAssetDragId(dataTransfer: DataTransfer): string | null {
  const value = dataTransfer.getData("text/plain");
  if (!value.startsWith(ASSET_DRAG_PREFIX)) {
    return null;
  }
  const assetId = value.slice(ASSET_DRAG_PREFIX.length);
  return assetId.length > 0 ? assetId : null;
}

export function isAssetDrag(dataTransfer: DataTransfer): boolean {
  return [...dataTransfer.types].includes("text/plain");
}
