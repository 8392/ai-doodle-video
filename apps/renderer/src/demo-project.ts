import { demoProjectJson } from "@ai-doodle/asset-library";
import { parseVideoProject, type VideoProject } from "@ai-doodle/video-schema";

export function loadDemoProject(): VideoProject {
  return parseVideoProject(demoProjectJson);
}
