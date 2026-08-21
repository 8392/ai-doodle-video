import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";

export type Session = {
  token: string;
  userId: string;
  name: string;
};

export type StoredProject = {
  ownerId: string;
  shareId?: string;
  updatedAt: string;
  project: VideoProject;
};

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function createStore(repoRoot: string) {
  const root = resolve(repoRoot, "data");
  const sessionsPath = resolve(root, "sessions.json");
  const projectsDir = resolve(root, "projects");
  const sharesPath = resolve(root, "shares.json");
  mkdirSync(projectsDir, { recursive: true });

  const loadSessions = (): Session[] => readJson<Session[]>(sessionsPath, []);
  const saveSessions = (sessions: Session[]) =>
    writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
  const loadShares = (): Record<string, string> =>
    readJson<Record<string, string>>(sharesPath, {});
  const saveShares = (shares: Record<string, string>) =>
    writeFileSync(sharesPath, JSON.stringify(shares, null, 2));
  const projectPath = (id: string) => resolve(projectsDir, `${id}.json`);

  const readProject = (id: string): StoredProject | undefined => {
    try {
      const raw = JSON.parse(readFileSync(projectPath(id), "utf8")) as StoredProject;
      return { ...raw, project: parseVideoProject(raw.project) };
    } catch {
      return undefined;
    }
  };

  return {
    createSession(name: string): Session {
      const session: Session = {
        token: crypto.randomUUID().replaceAll("-", ""),
        userId: `user-${crypto.randomUUID().slice(0, 8)}`,
        name: name.trim() || "创作者",
      };
      const sessions = loadSessions();
      sessions.push(session);
      saveSessions(sessions);
      return session;
    },
    getSession(token: string | undefined): Session | undefined {
      if (!token) {
        return undefined;
      }
      return loadSessions().find((item) => item.token === token);
    },
    saveProject(ownerId: string, project: VideoProject): StoredProject {
      const existing = readProject(project.id);
      const record: StoredProject = {
        ownerId: existing?.ownerId ?? ownerId,
        shareId: existing?.shareId,
        updatedAt: new Date().toISOString(),
        project: parseVideoProject(project),
      };
      writeFileSync(projectPath(project.id), JSON.stringify(record, null, 2));
      return record;
    },
    readProject,
    listProjects(ownerId: string): StoredProject[] {
      return readdirSync(projectsDir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => readProject(name.replace(/\.json$/, "")))
        .filter((item): item is StoredProject => Boolean(item && item.ownerId === ownerId))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    deleteProject(id: string, ownerId: string): boolean {
      const existing = readProject(id);
      if (!existing || existing.ownerId !== ownerId) {
        return false;
      }
      unlinkSync(projectPath(id));
      return true;
    },
    shareProject(id: string, ownerId: string): string | undefined {
      const existing = readProject(id);
      if (!existing || existing.ownerId !== ownerId) {
        return undefined;
      }
      const shareId = existing.shareId ?? crypto.randomUUID().slice(0, 10);
      writeFileSync(projectPath(id), JSON.stringify({ ...existing, shareId }, null, 2));
      const shares = loadShares();
      shares[shareId] = id;
      saveShares(shares);
      return shareId;
    },
    readShared(shareId: string): VideoProject | undefined {
      const projectId = loadShares()[shareId];
      if (!projectId) {
        return undefined;
      }
      return readProject(projectId)?.project;
    },
  };
}

export type ProjectStore = ReturnType<typeof createStore>;
