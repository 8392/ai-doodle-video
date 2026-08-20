import { loadDemoProject } from "@ai-doodle/renderer";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";
import { create } from "zustand";
import { loadProjectJson, saveProjectJson } from "../lib/local-project";
import {
  addAssetToScene,
  flattenSceneCameras,
  removeElement,
  setDefaultTransition,
  setProjectName,
  setSceneTransition,
  updateElement,
} from "../editor/project-edits";
import type { AssetDefinition } from "@ai-doodle/asset-library";
import type { TransitionConfig } from "@ai-doodle/video-schema";

type ElementPatch = Parameters<typeof updateElement>[2];

type EditorState = {
  project: VideoProject | null;
  selectedSceneId: string | null;
  selectedElementId: string | null;
  saveStatus: "idle" | "saved" | "error";
  loadProject: (projectId: string) => void;
  setName: (name: string) => void;
  selectScene: (sceneId: string) => void;
  selectElement: (elementId: string | null) => void;
  addAsset: (asset: AssetDefinition) => void;
  addAssetAt: (asset: AssetDefinition, position: { x: number; y: number }) => void;
  patchElement: (patch: ElementPatch) => void;
  moveElement: (elementId: string, patch: ElementPatch) => void;
  patchDefaultTransition: (transition: TransitionConfig) => void;
  patchSceneTransition: (transition: TransitionConfig | undefined) => void;
  removeSelectedElement: () => void;
  persist: () => void;
};

function withProject(
  set: (partial: Partial<EditorState> | ((state: EditorState) => Partial<EditorState>)) => void,
  get: () => EditorState,
  updater: (project: VideoProject) => VideoProject,
): void {
  const current = get().project;
  if (!current) {
    return;
  }
  set({ project: updater(current), saveStatus: "idle" });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  selectedSceneId: null,
  selectedElementId: null,
  saveStatus: "idle",
  loadProject: (projectId) => {
    try {
      const stored = loadProjectJson(projectId);
      const raw = stored
        ? parseVideoProject(JSON.parse(stored) as unknown)
        : { ...loadDemoProject(), id: projectId };
      const project = flattenSceneCameras(raw);
      set({
        project,
        selectedSceneId: project.scenes[0]?.id ?? null,
        selectedElementId: project.scenes[0]?.elements[0]?.id ?? null,
        saveStatus: "idle",
      });
    } catch {
      const project = flattenSceneCameras({ ...loadDemoProject(), id: projectId });
      set({
        project,
        selectedSceneId: project.scenes[0]?.id ?? null,
        selectedElementId: project.scenes[0]?.elements[0]?.id ?? null,
        saveStatus: "error",
      });
    }
  },
  setName: (name) => withProject(set, get, (project) => setProjectName(project, name)),
  selectScene: (sceneId) => set({ selectedSceneId: sceneId }),
  selectElement: (elementId) => set({ selectedElementId: elementId }),
  addAsset: (asset) => {
    const { project, selectedSceneId } = get();
    if (!project || !selectedSceneId) {
      return;
    }
    const result = addAssetToScene(project, selectedSceneId, asset);
    set({
      project: result.project,
      selectedElementId: result.elementId,
      saveStatus: "idle",
    });
  },
  addAssetAt: (asset, position) => {
    const { project, selectedSceneId } = get();
    if (!project || !selectedSceneId) {
      return;
    }
    const result = addAssetToScene(project, selectedSceneId, asset, position);
    set({
      project: result.project,
      selectedElementId: result.elementId,
      saveStatus: "idle",
    });
  },
  patchElement: (patch) => {
    const { project, selectedElementId } = get();
    if (!project || !selectedElementId) {
      return;
    }
    set({
      project: updateElement(project, selectedElementId, patch),
      saveStatus: "idle",
    });
  },
  moveElement: (elementId, patch) => {
    const { project } = get();
    if (!project) {
      return;
    }
    set({
      project: updateElement(project, elementId, patch),
      saveStatus: "idle",
    });
  },
  patchDefaultTransition: (transition) => {
    withProject(set, get, (project) => setDefaultTransition(project, transition));
  },
  patchSceneTransition: (transition) => {
    const { selectedSceneId } = get();
    if (!selectedSceneId) {
      return;
    }
    withProject(set, get, (project) =>
      setSceneTransition(project, selectedSceneId, transition),
    );
  },
  removeSelectedElement: () => {
    const { project, selectedElementId } = get();
    if (!project || !selectedElementId) {
      return;
    }
    set({
      project: removeElement(project, selectedElementId),
      selectedElementId: null,
      saveStatus: "idle",
    });
  },
  persist: () => {
    const { project } = get();
    if (!project) {
      return;
    }
    try {
      saveProjectJson(project.id, JSON.stringify(project));
      set({ saveStatus: "saved" });
    } catch {
      set({ saveStatus: "error" });
    }
  },
}));
