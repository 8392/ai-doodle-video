import { assets, type AssetDefinition } from "./registry";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function searchAssets(query: string): AssetDefinition[] {
  const needle = normalize(query);
  if (!needle) {
    return [...assets];
  }

  return assets.filter((asset) => {
    if (normalize(asset.id).includes(needle) || normalize(asset.name).includes(needle)) {
      return true;
    }
    return asset.tags.some((tag) => normalize(tag).includes(needle));
  });
}

export function listAssetsByCategory(
  category: AssetDefinition["category"],
): AssetDefinition[] {
  return assets.filter((asset) => asset.category === category);
}
