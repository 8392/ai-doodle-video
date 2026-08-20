import { findKeywordSpans } from "./match-assets";

const MIN_SCENES = 3;
const MAX_SCENES = 6;
const SENTENCE_DELIMS = /[。！？!?；;\n]+/;
const CLAUSE_DELIMS = /[，,、]+/;

export class EmptyScriptError extends Error {
  constructor() {
    super("请先输入文案");
    this.name = "EmptyScriptError";
  }
}

export function splitScript(script: string): string[] {
  const trimmed = script.trim();
  if (!trimmed) {
    throw new EmptyScriptError();
  }

  let parts = splitBy(trimmed, SENTENCE_DELIMS);
  if (parts.length < MIN_SCENES) {
    parts = parts.flatMap((part) => {
      const clauses = splitBy(part, CLAUSE_DELIMS);
      return clauses.length > 1 ? clauses : [part];
    });
  }
  if (parts.length < MIN_SCENES) {
    parts = expandShortScript(trimmed);
  }
  if (parts.length > MAX_SCENES) {
    parts = mergeAdjacentShort(parts, MAX_SCENES);
  }
  return parts.slice(0, MAX_SCENES);
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
      const score = left.length + right.length;
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
