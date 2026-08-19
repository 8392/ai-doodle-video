import type { VideoProject } from "@ai-doodle/video-schema";
import { create } from "zustand";

type PreviewState = {
  project: VideoProject | null;
  setProject: (project: VideoProject) => void;
};

export const usePreviewStore = create<PreviewState>((set) => ({
  project: null,
  setProject: (project) => set({ project }),
}));
