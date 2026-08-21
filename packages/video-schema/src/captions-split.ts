import type { Caption } from "./caption";
import type { VideoProject } from "./project";

const SENTENCE_DELIMS = /[。！？!?；;\n]+/;

export function splitSpokenSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  const parts = trimmed
    .split(SENTENCE_DELIMS)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts : [trimmed];
}

/**
 * Split each scene caption into sentence-level cues, weighted by character count.
 * Scenes without punctuation stay as a single caption.
 */
export function expandCaptionsBySentence(project: VideoProject): VideoProject {
  const captions: Caption[] = [];
  for (const [sceneIndex, scene] of project.scenes.entries()) {
    const style = project.captions?.find(
      (caption) =>
        caption.startFrame >= scene.startFrame &&
        caption.startFrame < scene.startFrame + scene.durationInFrames,
    )?.style;
    const sentences = splitSpokenSentences(scene.narration ?? "");
    if (sentences.length <= 1) {
      captions.push({
        text:
          sentences[0] ||
          scene.narration?.trim() ||
          `Scene ${sceneIndex + 1}`,
        startFrame: scene.startFrame,
        endFrame: scene.startFrame + scene.durationInFrames,
        style,
      });
      continue;
    }
    const weights = sentences.map((sentence) => Math.max([...sentence].length, 4));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let cursor = scene.startFrame;
    const sceneEnd = scene.startFrame + scene.durationInFrames;
    sentences.forEach((sentence, index) => {
      const isLast = index === sentences.length - 1;
      const share = Math.max(
        1,
        Math.round((scene.durationInFrames * (weights[index] ?? 4)) / total),
      );
      const endFrame = isLast ? sceneEnd : Math.min(sceneEnd, cursor + share);
      captions.push({
        text: sentence,
        startFrame: cursor,
        endFrame: Math.max(cursor + 1, endFrame),
        style,
      });
      cursor = Math.max(cursor + 1, endFrame);
    });
  }
  return { ...project, captions };
}
