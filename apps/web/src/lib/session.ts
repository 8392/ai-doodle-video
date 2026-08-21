const TOKEN_KEY = "ai-doodle-token";
const USER_KEY = "ai-doodle-user";

export type SessionUser = {
  id: string;
  name: string;
};

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function signIn(name: string): Promise<SessionUser> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const payload = (await response.json()) as {
    error?: string;
    token?: string;
    user?: SessionUser;
  };
  if (!response.ok || !payload.token || !payload.user) {
    throw new Error(payload.error || "登录失败");
  }
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload.user;
}

export function signOut(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function cloudSaveProject(project: unknown): Promise<void> {
  const id = (project as { id?: string }).id;
  if (!id) {
    return;
  }
  await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ project }),
  });
}

export async function cloudFetchProject(id: string): Promise<unknown | null> {
  const response = await fetch(`/api/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { project?: unknown };
  return payload.project ?? null;
}

export async function createShareLink(projectId: string): Promise<string> {
  const response = await fetch(`/api/projects/${projectId}/share`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const payload = (await response.json()) as { error?: string; url?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "分享失败");
  }
  return payload.url;
}

export async function fetchSharedProject(shareId: string): Promise<unknown> {
  const response = await fetch(`/api/shares/${shareId}`);
  const payload = (await response.json()) as { error?: string; project?: unknown };
  if (!response.ok || !payload.project) {
    throw new Error(payload.error || "分享不存在");
  }
  return payload.project;
}

export async function uploadAssetFile(file: File): Promise<{ src: string; name: string; id: string }> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const payload = (await response.json()) as {
    error?: string;
    src?: string;
    name?: string;
    id?: string;
  };
  if (!response.ok || !payload.src || !payload.id) {
    throw new Error(payload.error || "上传失败");
  }
  return { src: payload.src, name: payload.name ?? file.name, id: payload.id };
}

export async function startCloudRender(project: unknown): Promise<string> {
  const response = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  });
  const payload = (await response.json()) as { error?: string; jobId?: string };
  if (!response.ok || !payload.jobId) {
    throw new Error(payload.error || "无法启动云端渲染");
  }
  return payload.jobId;
}

export async function pollCloudRender(
  jobId: string,
): Promise<{ status: string; error?: string; output?: string }> {
  const response = await fetch(`/api/render/${jobId}`);
  const payload = (await response.json()) as {
    status?: string;
    error?: string;
    output?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "查询渲染任务失败");
  }
  return {
    status: payload.status ?? "error",
    error: payload.error,
    output: payload.output,
  };
}

export async function fetchServiceStatus(): Promise<{ llm: boolean; azureTts: boolean }> {
  const response = await fetch("/api/status");
  if (!response.ok) {
    return { llm: false, azureTts: false };
  }
  return (await response.json()) as { llm: boolean; azureTts: boolean };
}
