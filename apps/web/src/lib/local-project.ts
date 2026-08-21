import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";

const STORAGE_PREFIX = "ai-doodle-project:";

export type LocalProjectSummary = {
  id: string;
  name: string;
  fps: number;
  durationInFrames: number;
  width: number;
  height: number;
};

export function saveProjectJson(projectId: string, json: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, json);
}

export function loadProjectJson(projectId: string): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
}

export function deleteProjectJson(projectId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${projectId}`);
}

export function listLocalProjects(): LocalProjectSummary[] {
  const items: LocalProjectSummary[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) {
      continue;
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }
    try {
      const project = parseVideoProject(JSON.parse(raw) as unknown);
      items.push({
        id: project.id,
        name: project.name,
        fps: project.fps,
        durationInFrames: project.durationInFrames,
        width: project.width,
        height: project.height,
      });
    } catch {
      const id = key.slice(STORAGE_PREFIX.length);
      items.push({
        id,
        name: id,
        fps: 30,
        durationInFrames: 1,
        width: 1080,
        height: 1920,
      });
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, "zh"));
}

export function loadLocalProject(projectId: string): VideoProject | null {
  const stored = loadProjectJson(projectId);
  if (!stored) {
    return null;
  }
  try {
    return parseVideoProject(JSON.parse(stored) as unknown);
  } catch {
    return null;
  }
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, json: string): void {
  downloadBlob(filename, new Blob([json], { type: "application/json" }));
}
