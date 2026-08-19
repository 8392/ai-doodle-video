import { z } from "zod";

export const audioTrackSchema = z.object({
  src: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().positive(),
  volume: z.number().min(0).max(1).optional(),
});

export type AudioTrack = z.infer<typeof audioTrackSchema>;
