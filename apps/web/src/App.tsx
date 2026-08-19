import { Navigate, Route, Routes } from "react-router-dom";
import { CreatePage } from "./pages/CreatePage";
import { EditorPage } from "./pages/EditorPage";
import { PreviewPage } from "./pages/PreviewPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/create" replace />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
      <Route path="/preview" element={<PreviewPage />} />
    </Routes>
  );
}
