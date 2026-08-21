import { findKeywordSpans } from "./match-assets";

export const MIN_SCENES = 3;
/** Soft cap so extreme paste does not flood the timeline. */
export const MAX_SCENES_SOFT = 24;
/** Prefer roughly one or two short clauses per scene. */
export const MAX_CHARS_PER_SCENE = 32;

const SENTENCE_DELIMS = /[。！？!?；;\n]+/;
const CLAUSE_DELIMS = /[，,、]+/;

export class EmptyScriptError extends Error {
  constructor() {
    super("请先输入文案");
    this.name = "EmptyScriptError";
  }
}

export type SplitScriptResult = {
  parts: string[];
  truncated: boolean;
};

export function splitScript(script: string): string[] {
  return splitScriptWithMeta(script).parts;
}

export function splitScriptWithMeta(script: string): SplitScriptResult {
  const trimmed = script.trim();
  if (!trimmed) {
    throw new EmptyScriptError();
  }

  let parts = splitBy(trimmed, SENTENCE_DELIMS)
    .flatMap(preferClauseSplit)
    .flatMap(enforceMaxChars);
  if (parts.length < MIN_SCENES) {
    parts = parts
      .flatMap((part) => {
        const clauses = splitBy(part, CLAUSE_DELIMS);
        return clauses.length > 1 ? clauses : [part];
      })
      .flatMap(enforceMaxChars);
  }
  if (parts.length < MIN_SCENES) {
    parts = expandShortScript(trimmed).flatMap(enforceMaxChars);
  }

  let truncated = false;
  if (parts.length > MAX_SCENES_SOFT) {
    parts = mergeAdjacentShort(parts, MAX_SCENES_SOFT);
    truncated = true;
  }

  return { parts, truncated };
}

function charCount(text: string): number {
  return [...text].length;
}

/** Prefer breaking on commas once a sentence is longer than a short subtitle. */
function preferClauseSplit(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  if (charCount(trimmed) <= 18) {
    return [trimmed];
  }
  const clauses = splitBy(trimmed, CLAUSE_DELIMS);
  return clauses.length > 1 ? clauses : [trimmed];
}

function enforceMaxChars(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  if (charCount(trimmed) <= MAX_CHARS_PER_SCENE) {
    return [trimmed];
  }

  const clauses = splitBy(trimmed, CLAUSE_DELIMS);
  if (clauses.length > 1) {
    const nested = clauses.flatMap(enforceMaxChars);
    if (nested.every((part) => charCount(part) <= MAX_CHARS_PER_SCENE)) {
      return nested;
    }
    return nested.flatMap((part) =>
      charCount(part) <= MAX_CHARS_PER_SCENE ? [part] : splitByMaxChars(part),
    );
  }

  return splitByMaxChars(trimmed);
}

function splitByMaxChars(text: string): string[] {
  const chars = [...text];
  const parts: string[] = [];
  let cursor = 0;
  while (cursor < chars.length) {
    if (chars.length - cursor <= MAX_CHARS_PER_SCENE) {
      const rest = chars.slice(cursor).join("").trim();
      if (rest) {
        parts.push(rest);
      }
      break;
    }
    let end = cursor + MAX_CHARS_PER_SCENE;
    const windowStart = Math.max(cursor + Math.floor(MAX_CHARS_PER_SCENE * 0.55), cursor + 1);
    for (let i = end - 1; i >= windowStart; i -= 1) {
      const ch = chars[i];
      if (ch && /[，,、\s]/.test(ch)) {
        end = i + 1;
        break;
      }
    }
    const chunk = chars.slice(cursor, end).join("").trim();
    if (chunk) {
      parts.push(chunk);
    }
    cursor = end;
  }
  return parts;
}

function splitBy(text: string, delim: RegExp): string[] {
  return text
    .split(delim)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function expandShortScript(text: string): string[] {
  const fromKeywords = splitByKeywordSpans(text);
  if (fromKeywords.length >= MIN_SCENES) {
    return fromKeywords;
  }
  const fromLength = splitByLength(text, MIN_SCENES);
  if (fromLength.length >= MIN_SCENES) {
    return fromLength;
  }
  const padded = [...fromLength];
  while (padded.length < MIN_SCENES) {
    padded.push(text);
  }
  return padded;
}

function splitByKeywordSpans(text: string): string[] {
  const spans = findKeywordSpans(text);
  if (spans.length === 0) {
    return [text];
  }

  const parts: string[] = [];
  for (let index = 0; index < spans.length; index += 1) {
    const span = spans[index];
    if (!span) {
      continue;
    }
    const start = index === 0 ? 0 : (spans[index - 1]?.end ?? 0);
    const end = index === spans.length - 1 ? text.length : span.end;
    const chunk = text.slice(start, end).trim();
    if (chunk) {
      parts.push(chunk);
    }
  }
  return parts;
}

function splitByLength(text: string, count: number): string[] {
  const chars = [...text];
  if (chars.length === 0) {
    return [];
  }
  const size = Math.max(1, Math.ceil(chars.length / count));
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += size) {
    const chunk = chars.slice(i, i + size).join("").trim();
    if (chunk) {
      parts.push(chunk);
    }
  }
  return parts;
}

function mergeAdjacentShort(parts: string[], max: number): string[] {
  const next = [...parts];
  while (next.length > max) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < next.length - 1; i++) {
      const left = next[i] ?? "";
      const right = next[i + 1] ?? "";
      const score = charCount(left) + charCount(right);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    const merged = `${next[bestIndex] ?? ""}${next[bestIndex + 1] ?? ""}`.trim();
    next.splice(bestIndex, 2, merged);
  }
  return next;
}
