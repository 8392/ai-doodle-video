import { z } from "zod";

export const captionStyleSchema = z.object({
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export const captionSchema = z.object({
  text: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  style: captionStyleSchema.optional(),
});

export type CaptionStyle = z.infer<typeof captionStyleSchema>;
export type Caption = z.infer<typeof captionSchema>;
