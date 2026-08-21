import { loadDemoProject } from "@ai-doodle/renderer";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";
import { create } from "zustand";
import { loadProjectJson, saveProjectJson } from "../lib/local-project";
import { cloudFetchProject, cloudSaveProject } from "../lib/session";
import {
  addAssetToScene,
  addImageSrcToScene,
  addPrimitiveToScene,
  addScene,
  moveElementInScene,
  moveScene,
  removeElement,
  removeScene,
  setDefaultTransition,
  setProjectMusic,
  setProjectName,
  setProjectDrawing,
  setSceneTransition,
  updateElement,
  updateScene,
} from "../editor/project-edits";
import type { AssetDefinition } from "@ai-doodle/asset-library";
import type { TransitionConfig } from "@ai-doodle/video-schema";

type ElementPatch = Parameters<typeof updateElement>[2];
const HISTORY_LIMIT = 50;

type EditorState = {
  project: VideoProject | null;
  loadError: string | null;
  selectedSceneId: string | null;
  selectedElementId: string | null;
  saveStatus: "idle" | "saved" | "saving" | "error";
  past: VideoProject[];
  future: VideoProject[];
  loadProject: (projectId: string) => void;
  setName: (name: string) => void;
  selectScene: (sceneId: string) => void;
  selectElement: (elementId: string | null) => void;
  addAsset: (asset: AssetDefinition) => void;
  addAssetAt: (asset: AssetDefinition, position: { x: number; y: number }) => void;
  addPrimitive: (type: "text" | "arrow" | "shape") => void;
  addImageSrc: (src: string, meta?: { name?: string; id?: string; type?: "svg" | "image" }) => void;
  patchDrawing: (drawing: NonNullable<VideoProject["drawing"]>) => void;
  patchElement: (patch: ElementPatch) => void;
  moveElement: (elementId: string, patch: ElementPatch) => void;
  patchDefaultTransition: (transition: TransitionConfig) => void;
  patchSceneTransition: (transition: TransitionConfig | undefined) => void;
  addSceneAfterSelected: () => void;
  removeSelectedScene: () => void;
  moveSelectedScene: (direction: -1 | 1) => void;
  patchScene: (patch: Parameters<typeof updateScene>[2]) => void;
  setMusic: (music: VideoProject["music"]) => void;
  reorderElement: (elementId: string, direction: -1 | 1) => void;
  removeSelectedElement: () => void;
  replaceProject: (project: VideoProject) => void;
  undo: () => void;
  redo: () => void;
  persist: () => void;
};

function commit(
  set: (partial: Partial<EditorState> | ((state: EditorState) => Partial<EditorState>)) => void,
  get: () => EditorState,
  updater: (project: VideoProject) => VideoProject,
): void {
  const current = get().project;
  if (!current) {
    return;
  }
  const next = updater(current);
  if (next === current) {
    return;
  }
  set({
    project: next,
    past: [...get().past, current].slice(-HISTORY_LIMIT),
    future: [],
    saveStatus: "idle",
  });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  loadError: null,
  selectedSceneId: null,
  selectedElementId: null,
  saveStatus: "idle",
  past: [],
  future: [],
  loadProject: (projectId) => {
    try {
      const stored = loadProjectJson(projectId);
      if (stored) {
        const project = parseVideoProject(JSON.parse(stored) as unknown);
        set({
          project,
          loadError: null,
          selectedSceneId: project.scenes[0]?.id ?? null,
          selectedElementId: project.scenes[0]?.elements[0]?.id ?? null,
          saveStatus: "idle",
          past: [],
          future: [],
        });
        return;
      }
      if (projectId === "demo") {
        const project = { ...loadDemoProject(), id: "demo" };
        set({
          project,
          loadError: null,
          selectedSceneId: project.scenes[0]?.id ?? null,
          selectedElementId: project.scenes[0]?.elements[0]?.id ?? null,
          saveStatus: "idle",
          past: [],
          future: [],
        });
        return;
      }
      void cloudFetchProject(projectId).then((raw) => {
        if (!raw) {
          set({
            project: null,
            loadError: "找不到这个项目。它可能只存在于另一台浏览器里。",
            past: [],
            future: [],
          });
          return;
        }
        const project = parseVideoProject(raw);
        set({
          project,
          loadError: null,
          selectedSceneId: project.scenes[0]?.id ?? null,
          selectedElementId: project.scenes[0]?.elements[0]?.id ?? null,
          saveStatus: "idle",
          past: [],
          future: [],
        });
      });
    } catch {
      set({
        project: null,
        loadError: "项目文件损坏，无法打开。",
        saveStatus: "error",
        past: [],
        future: [],
      });
    }
  },
  setName: (name) => commit(set, get, (project) => setProjectName(project, name)),
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
      past: [...get().past, project].slice(-HISTORY_LIMIT),
      future: [],
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
      past: [...get().past, project].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "idle",
    });
  },
  addPrimitive: (type) => {
    const { project, selectedSceneId } = get();
    if (!project || !selectedSceneId) {
      return;
    }
    const result = addPrimitiveToScene(project, selectedSceneId, type);
    set({
      project: result.project,
      selectedElementId: result.elementId,
      past: [...get().past, project].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "idle",
    });
  },
  addImageSrc: (src, meta) => {
    const { project, selectedSceneId } = get();
    if (!project || !selectedSceneId) {
      return;
    }
    const result = addImageSrcToScene(project, selectedSceneId, src, undefined, meta);
    set({
      project: result.project,
      selectedElementId: result.elementId,
      past: [...get().past, project].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "idle",
    });
  },
  patchDrawing: (drawing) => {
    commit(set, get, (project) => setProjectDrawing(project, drawing));
  },
  patchElement: (patch) => {
    const { selectedElementId } = get();
    if (!selectedElementId) {
      return;
    }
    commit(set, get, (project) => updateElement(project, selectedElementId, patch));
  },
  moveElement: (elementId, patch) => {
    commit(set, get, (project) => updateElement(project, elementId, patch));
  },
  patchDefaultTransition: (transition) => {
    commit(set, get, (project) => setDefaultTransition(project, transition));
  },
  patchSceneTransition: (transition) => {
    const { selectedSceneId } = get();
    if (!selectedSceneId) {
      return;
    }
    commit(set, get, (project) =>
      setSceneTransition(project, selectedSceneId, transition),
    );
  },
  addSceneAfterSelected: () => {
    const { project, selectedSceneId } = get();
    if (!project) {
      return;
    }
    const result = addScene(project, selectedSceneId);
    set({
      project: result.project,
      selectedSceneId: result.sceneId,
      selectedElementId: null,
      past: [...get().past, project].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "idle",
    });
  },
  removeSelectedScene: () => {
    const { project, selectedSceneId } = get();
    if (!project || !selectedSceneId || project.scenes.length <= 1) {
      return;
    }
    const index = project.scenes.findIndex((scene) => scene.id === selectedSceneId);
    const next = removeScene(project, selectedSceneId);
    const fallback = next.scenes[Math.max(0, index - 1)] ?? next.scenes[0];
    set({
      project: next,
      selectedSceneId: fallback?.id ?? null,
      selectedElementId: fallback?.elements[0]?.id ?? null,
      past: [...get().past, project].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "idle",
    });
  },
  moveSelectedScene: (direction) => {
    const { selectedSceneId } = get();
    if (!selectedSceneId) {
      return;
    }
    commit(set, get, (project) => moveScene(project, selectedSceneId, direction));
  },
  patchScene: (patch) => {
    const { selectedSceneId } = get();
    if (!selectedSceneId) {
      return;
    }
    commit(set, get, (project) => updateScene(project, selectedSceneId, patch));
  },
  setMusic: (music) => commit(set, get, (project) => setProjectMusic(project, music)),
  reorderElement: (elementId, direction) => {
    const { selectedSceneId } = get();
    if (!selectedSceneId) {
      return;
    }
    commit(set, get, (project) =>
      moveElementInScene(project, selectedSceneId, elementId, direction),
    );
  },
  removeSelectedElement: () => {
    const { project, selectedElementId } = get();
    if (!project || !selectedElementId) {
      return;
    }
    commit(set, get, (current) => removeElement(current, selectedElementId));
    set({ selectedElementId: null });
  },
  replaceProject: (project) => {
    const current = get();
    const keepScene =
      project.scenes.find((scene) => scene.id === current.selectedSceneId)?.id ??
      project.scenes[0]?.id ??
      null;
    const keepSceneObj = project.scenes.find((scene) => scene.id === keepScene);
    const keepElement =
      keepSceneObj?.elements.find((el) => el.id === current.selectedElementId)?.id ??
      keepSceneObj?.elements[0]?.id ??
      null;
    set({
      project,
      selectedSceneId: keepScene,
      selectedElementId: keepElement,
      past: current.project
        ? [...current.past, current.project].slice(-HISTORY_LIMIT)
        : current.past,
      future: [],
      saveStatus: "idle",
      loadError: null,
    });
  },
  undo: () => {
    const { past, project, future } = get();
    const previous = past[past.length - 1];
    if (!previous || !project) {
      return;
    }
    set({
      project: previous,
      past: past.slice(0, -1),
      future: [project, ...future],
      saveStatus: "idle",
    });
  },
  redo: () => {
    const { future, project, past } = get();
    const next = future[0];
    if (!next || !project) {
      return;
    }
    set({
      project: next,
      past: [...past, project].slice(-HISTORY_LIMIT),
      future: future.slice(1),
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
      set({ saveStatus: "saving" });
      void cloudSaveProject(project)
        .then(() => set({ saveStatus: "saved" }))
        .catch(() => set({ saveStatus: "saved" }));
    } catch {
      set({ saveStatus: "error" });
    }
  },
}));
