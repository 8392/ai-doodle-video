import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { deleteProjectJson, listLocalProjects } from "../lib/local-project";
import { AppNav } from "../components/AppNav";

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => listLocalProjects());

  return (
    <div className="min-h-screen bg-paper px-6 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <AppNav current="projects" />
        <h1 className="font-display text-4xl">我的白板项目</h1>
        <p className="mt-3 text-sm text-ink/55">
          保存在这台浏览器里。登录后也会同步到本机 API 的 data/projects。
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/create"
            className="rounded-xl bg-ink px-4 py-2.5 text-sm text-paper"
          >
            新建视频
          </Link>
        </div>
        <ul className="mt-8 space-y-3">
          {projects.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-sm text-ink/45">
              还没有项目。去创建页贴一段文案即可生成。
            </li>
          ) : (
            projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white px-4 py-3"
              >
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => navigate(`/editor/${project.id}`)}
                >
                  <p className="truncate font-medium">{project.name}</p>
                  <p className="mt-1 text-xs text-ink/40">
                    {project.width}×{project.height} ·{" "}
                    {(project.durationInFrames / project.fps).toFixed(1)}s
                  </p>
                </button>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/preview/${project.id}`}
                    className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs"
                  >
                    预览
                  </Link>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600"
                    onClick={() => {
                      deleteProjectJson(project.id);
                      setProjects(listLocalProjects());
                    }}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
