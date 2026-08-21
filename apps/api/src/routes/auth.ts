import { Hono } from "hono";
import type { ProjectStore } from "../store";

function bearer(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }
  return header.replace(/^Bearer\s+/i, "").trim() || undefined;
}

export function createAuthRouter(store: ProjectStore): Hono {
  const router = new Hono();

  router.post("/session", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name : "创作者";
    const session = store.createSession(name);
    return c.json({ token: session.token, user: { id: session.userId, name: session.name } });
  });

  router.get("/session", (c) => {
    const session = store.getSession(bearer(c.req.header("Authorization")));
    if (!session) {
      return c.json({ error: "未登录" }, 401);
    }
    return c.json({ user: { id: session.userId, name: session.name } });
  });

  return router;
}

export function requireUser(
  store: ProjectStore,
  header: string | undefined,
): { userId: string; name: string } {
  const session = store.getSession(bearer(header));
  if (session) {
    return { userId: session.userId, name: session.name };
  }
  return { userId: "local", name: "本地" };
}
