export {
  assets,
  getAsset,
  getAssetOrThrow,
  type AssetCategory,
  type AssetDefinition,
  type AssetThemeTag,
} from "./registry";
export { listAssetsByCategory, searchAssets } from "./search";
export { assetMetaOverlays } from "./meta-overlays";
export { default as demoProjectJson } from "../demos/demo-project.json";
