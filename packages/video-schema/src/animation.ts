import { z } from "zod";

export const animationTypeSchema = z.enum([
  "draw",
  "fade",
  "pop",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
]);

export const animationConfigSchema = z.object({
  type: animationTypeSchema,
  durationInFrames: z.number().positive(),
  delayInFrames: z.number().nonnegative().optional(),
  easing: z.string().optional(),
});

export type AnimationType = z.infer<typeof animationTypeSchema>;
export type AnimationConfig = z.infer<typeof animationConfigSchema>;
