import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSessionUser, signIn, signOut, type SessionUser } from "../lib/session";

export function AppNav({ current }: { current?: "create" | "projects" | "editor" }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 text-sm">
        <Link
          to="/create"
          className={current === "create" ? "text-ink" : "text-ink/45 hover:text-ink"}
        >
          创建
        </Link>
        <Link
          to="/projects"
          className={current === "projects" ? "text-ink" : "text-ink/45 hover:text-ink"}
        >
          项目
        </Link>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink/50">
        {user ? (
          <>
            <span>{user.name}</span>
            <button type="button" onClick={() => { signOut(); setUser(null); }}>
              退出
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("怎么称呼你？", "创作者") ?? "";
              void signIn(name).then(setUser).catch(() => undefined);
            }}
          >
            登录云端
          </button>
        )}
      </div>
    </div>
  );
}
