import { z } from "zod";
import { audioTrackSchema } from "./audio";
import { captionSchema } from "./caption";
import { sceneSchema } from "./scene";
import { transitionSchema } from "./transition";

export const paperBackgroundSchema = z.object({
  type: z.literal("paper"),
  color: z.string().min(1),
});

export const projectStyleSchema = z.enum(["whiteboard", "blackboard", "line"]);

export const drawingDefaultAnimationSchema = z.enum(["draw", "fade", "pop"]);

export const projectDrawingSchema = z.object({
  handEnabled: z.boolean().default(true),
  defaultAnimation: drawingDefaultAnimationSchema.default("draw"),
});

export const userAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  src: z.string().min(1),
  type: z.enum(["svg", "image"]),
  createdAt: z.number().optional(),
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
  style: projectStyleSchema.optional(),
  drawing: projectDrawingSchema.optional(),
  userAssets: z.array(userAssetSchema).optional(),
  voice: z.string().optional(),
  narration: audioTrackSchema.optional(),
  music: audioTrackSchema.optional(),
  scenes: z.array(sceneSchema).min(1, "VideoProject must contain at least one scene"),
  captions: z.array(captionSchema).optional(),
  defaultTransition: transitionSchema.optional(),
});

export type PaperBackground = z.infer<typeof paperBackgroundSchema>;
export type ProjectStyle = z.infer<typeof projectStyleSchema>;
export type ProjectDrawing = z.infer<typeof projectDrawingSchema>;
export type UserAsset = z.infer<typeof userAssetSchema>;
export type VideoProject = z.infer<typeof videoProjectSchema>;
