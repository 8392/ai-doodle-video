import { ZodError } from "zod";
import { videoProjectSchema, type VideoProject } from "./project";

export class InvalidVideoProjectError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(issues.length > 0 ? `${message}: ${issues.join("; ")}` : message);
    this.name = "InvalidVideoProjectError";
    this.issues = issues;
  }
}

function collectSemanticIssues(project: VideoProject): string[] {
  const issues: string[] = [];

  if (project.scenes.length === 0) {
    issues.push("scenes must not be empty");
  }

  const sceneIds = new Set<string>();
  const elementIds = new Set<string>();

  for (const scene of project.scenes) {
    if (sceneIds.has(scene.id)) {
      issues.push(`duplicate scene id "${scene.id}"`);
    }
    sceneIds.add(scene.id);

    const sceneEnd = scene.startFrame + scene.durationInFrames;
    if (sceneEnd > project.durationInFrames) {
      issues.push(
        `scene "${scene.id}" ends at frame ${sceneEnd} which exceeds durationInFrames ${project.durationInFrames}`,
      );
    }

    for (const element of scene.elements) {
      if (elementIds.has(element.id)) {
        issues.push(`duplicate element id "${element.id}"`);
      }
      elementIds.add(element.id);

      if (
        (element.type === "svg" || element.type === "image") &&
        !element.assetId &&
        !element.src
      ) {
        issues.push(
          `element "${element.id}" of type ${element.type} is missing assetId or src`,
        );
      }
    }
  }

  if (project.captions) {
    for (const [index, caption] of project.captions.entries()) {
      if (caption.endFrame <= caption.startFrame) {
        issues.push(`caption[${index}] endFrame must be greater than startFrame`);
      }
      if (caption.endFrame > project.durationInFrames) {
        issues.push(`caption[${index}] endFrame exceeds project duration`);
      }
    }
  }

  return issues;
}

function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}

export function parseVideoProject(input: unknown): VideoProject {
  const parsed = videoProjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidVideoProjectError(
      "Invalid VideoProject JSON",
      formatZodError(parsed.error),
    );
  }

  const semanticIssues = collectSemanticIssues(parsed.data);
  if (semanticIssues.length > 0) {
    throw new InvalidVideoProjectError("Invalid VideoProject", semanticIssues);
  }

  return parsed.data;
}
