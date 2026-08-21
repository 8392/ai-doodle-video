export {
  EmptyScriptError,
  generateVideoProject,
  regenerateScene,
  heuristicScenePlan,
  type GenerateInput,
} from "./build-project";
export { inferLayout, layoutElements } from "./layout";
export { matchAssetsForNarration, resolveAssetsByIds } from "./match-assets";
export {
  applyMusic,
  findMusicTrack,
  MUSIC_TRACKS,
  type MusicTrack,
} from "./music";
export {
  applyNarrationAudio,
  applySceneAudioClips,
  buildNarrationScript,
  type NarrationAudioInput,
  type SceneAudioClip,
} from "./narration-audio";
export {
  applyProjectStyle,
  defaultDrawingForStyle,
  resolveProjectStyle,
  STYLE_OPTIONS,
  STYLE_PRESETS,
} from "./styles";
export { inferTheme, shortlistAssetsForTheme, type AssetTheme } from "./themes";
export {
  splitScript,
  splitScriptWithMeta,
  MAX_SCENES_SOFT,
  MAX_CHARS_PER_SCENE,
} from "./split-script";
export {
  findScriptTemplate,
  SCRIPT_TEMPLATES,
  type ScriptTemplate,
} from "./templates";
export {
  assembleVideoProject,
  buildStoryboardSystemPrompt,
  catalogForPrompt,
  extractJsonObject,
  parseStoryboardPlan,
  sizeForAspect,
  type AssembleInput,
  type ScenePlan,
  type StoryboardPlan,
} from "./storyboard";
