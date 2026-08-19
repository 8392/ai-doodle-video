import { z } from "zod";
import { elementSchema } from "./element";

export const cameraSchema = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
  durationInFrames: z.number().positive(),
  easing: z.string().optional(),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().positive(),
  narration: z.string().optional(),
  elements: z.array(elementSchema),
  camera: cameraSchema.optional(),
});

export type Camera = z.infer<typeof cameraSchema>;
export type Scene = z.infer<typeof sceneSchema>;
