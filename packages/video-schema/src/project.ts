import { z } from "zod";
import { audioTrackSchema } from "./audio";
import { captionSchema } from "./caption";
import { sceneSchema } from "./scene";
import { transitionSchema } from "./transition";

export const paperBackgroundSchema = z.object({
  type: z.literal("paper"),
  color: z.string().min(1),
});

export const videoProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  durationInFrames: z.number().positive(),
  background: paperBackgroundSchema,
  language: z.string().min(1),
  narration: audioTrackSchema.optional(),
  music: audioTrackSchema.optional(),
  scenes: z.array(sceneSchema).min(1, "VideoProject must contain at least one scene"),
  captions: z.array(captionSchema).optional(),
  defaultTransition: transitionSchema.optional(),
});

export type PaperBackground = z.infer<typeof paperBackgroundSchema>;
export type VideoProject = z.infer<typeof videoProjectSchema>;
