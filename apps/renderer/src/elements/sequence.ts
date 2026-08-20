import type { Element } from "@ai-doodle/video-schema";

const SEQUENCE_GAP_FRAMES = 6;

export function sequenceElementAnimations(
  elements: Element[],
  gapInFrames = SEQUENCE_GAP_FRAMES,
): Element[] {
  let cursor = 0;
  return elements.map((element) => {
    const animation = element.animation;
    if (!animation) {
      return element;
    }
    const sequenced: Element = {
      ...element,
      animation: {
        ...animation,
        delayInFrames: cursor,
      },
    };
    cursor += animation.durationInFrames + gapInFrames;
    return sequenced;
  });
}
