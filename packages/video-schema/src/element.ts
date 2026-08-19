import { z } from "zod";
import { animationConfigSchema } from "./animation";

export const elementTypeSchema = z.enum([
  "svg",
  "image",
  "text",
  "shape",
  "arrow",
  "hand",
]);

export const elementSchema = z.object({
  id: z.string().min(1),
  type: elementTypeSchema,
  assetId: z.string().min(1).optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  scale: z.number().positive().optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  zIndex: z.number().int().optional(),
  text: z.string().optional(),
  animation: animationConfigSchema.optional(),
});

export type ElementType = z.infer<typeof elementTypeSchema>;
export type Element = z.infer<typeof elementSchema>;
