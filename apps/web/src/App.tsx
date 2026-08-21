import { Navigate, Route, Routes } from "react-router-dom";
import { CreatePage } from "./pages/CreatePage";
import { EditorPage } from "./pages/EditorPage";
import { PreviewPage } from "./pages/PreviewPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SharePage } from "./pages/SharePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/create" replace />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
      <Route path="/preview/:projectId?" element={<PreviewPage />} />
      <Route path="/share/:shareId" element={<SharePage />} />
    </Routes>
  );
}
