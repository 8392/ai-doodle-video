const STORAGE_PREFIX = "ai-doodle-project:";

export function saveProjectJson(projectId: string, json: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, json);
}

export function loadProjectJson(projectId: string): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
}

export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
