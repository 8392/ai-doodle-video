export {
  EmptyScriptError,
  generateVideoProject,
  type GenerateInput,
} from "./build-project";
export { layoutElements } from "./layout";
export { matchAssetsForNarration } from "./match-assets";
export {
  applyNarrationAudio,
  buildNarrationScript,
  type NarrationAudioInput,
} from "./narration-audio";
export { splitScript, splitScriptWithMeta, MAX_SCENES_SOFT, MAX_CHARS_PER_SCENE } from "./split-script";
