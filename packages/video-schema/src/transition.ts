import { z } from "zod";

export const transitionTypeSchema = z.enum([
  "none",
  "fade",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
]);

export const transitionSchema = z.object({
  type: transitionTypeSchema,
  durationInFrames: z.number().int().positive(),
  easing: z.string().optional(),
});

export type TransitionType = z.infer<typeof transitionTypeSchema>;
export type TransitionConfig = z.infer<typeof transitionSchema>;
