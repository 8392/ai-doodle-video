import {
  assets,
  getAsset,
  searchAssets,
  type AssetDefinition,
} from "@ai-doodle/asset-library";

const GENERIC_TOKEN_ASSET_COUNT = 8;
const FALLBACK_IDS = ["globe", "newspaper"] as const;
const STRONG_SCORE = 4;

export type KeywordSpan = {
  start: number;
  end: number;
  token: string;
};

export function findKeywordSpans(text: string): KeywordSpan[] {
  const occupied = new Array<boolean>(text.length).fill(false);
  const spans: KeywordSpan[] = [];
  for (const token of catalogTokens()) {
    const haystack = text.toLowerCase();
    const needle = token.toLowerCase();
    let from = 0;
    while (from < haystack.length) {
      const index = haystack.indexOf(needle, from);
      if (index < 0) {
        break;
      }
      const end = index + token.length;
      const overlaps = occupied.slice(index, end).some(Boolean);
      if (!overlaps) {
        for (let i = index; i < end; i += 1) {
          occupied[i] = true;
        }
        spans.push({ start: index, end, token });
      }
      from = index + 1;
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}

export function matchAssetsForNarration(
  narration: string,
  usedAssetIds: string[] = [],
): AssetDefinition[] {
  const used = new Set(usedAssetIds);
  const fromKeywords = pickFromKeywordSpans(narration, used);
  if (fromKeywords.length > 0) {
    return fromKeywords;
  }

  const ranked = rankAssets(narration);
  const unusedStrong = ranked.filter((asset) => !used.has(asset.id));
  if (unusedStrong[0]) {
    return [unusedStrong[0]];
  }
  if (ranked[0]) {
    return [ranked[0]];
  }

  const fallback = uniqueFallback(used);
  return fallback ? [fallback] : [];
}

function pickFromKeywordSpans(
  narration: string,
  used: Set<string>,
): AssetDefinition[] {
  const picked: AssetDefinition[] = [];
  const pickedIds = new Set<string>();
  for (const span of findKeywordSpans(narration)) {
    if (picked.length >= 3) {
      break;
    }
    const ranked = rankAssets(span.token);
    const next =
      ranked.find((asset) => !used.has(asset.id) && !pickedIds.has(asset.id)) ??
      ranked.find((asset) => !pickedIds.has(asset.id));
    if (!next) {
      continue;
    }
    picked.push(next);
    pickedIds.add(next.id);
  }
  return picked;
}

function rankAssets(narration: string): AssetDefinition[] {
  const scores = new Map<string, number>();
  for (const token of tokenize(narration)) {
    if (isGenericToken(token)) {
      continue;
    }
    for (const asset of searchAssets(token)) {
      if (!isSceneIcon(asset)) {
        continue;
      }
      const points = scoreToken(asset, token);
      if (points < STRONG_SCORE) {
        continue;
      }
      scores.set(asset.id, (scores.get(asset.id) ?? 0) + points);
    }
  }

  const ranked = [...scores.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const top = ranked[0]?.[1] ?? 0;
  const named = ranked.filter(([, score]) => score >= 8);
  const chosen = named.length > 0 ? named : ranked.filter(([, score]) => score >= top);
  return chosen
    .map(([id]) => getAsset(id))
    .filter((asset): asset is AssetDefinition => Boolean(asset));
}

function scoreToken(asset: AssetDefinition, token: string): number {
  const lower = token.toLowerCase();
  if (asset.name === token || asset.name.toLowerCase() === lower) {
    return 10;
  }
  if (asset.id.toLowerCase() === lower) {
    return 8;
  }
  if (asset.tags.some((tag) => tag === token || tag.toLowerCase() === lower)) {
    return 4;
  }
  return 1;
}

function tokenize(text: string): string[] {
  const tokens = new Set<string>();
  const trimmed = text.trim();
  if (trimmed) {
    tokens.add(trimmed);
  }
  for (const word of text.split(/[^A-Za-z0-9]+/)) {
    if (word.length >= 2) {
      tokens.add(word);
    }
  }
  const cjk = (text.match(/[\u4e00-\u9fff]+/g) ?? []).join("");
  for (let size = 2; size <= 4; size += 1) {
    for (let i = 0; i <= cjk.length - size; i += 1) {
      tokens.add(cjk.slice(i, i + size));
    }
  }
  return [...tokens];
}

function catalogTokens(): string[] {
  const counts = new Map<string, number>();
  const tokens = new Set<string>();
  for (const asset of assets) {
    if (!isSceneIcon(asset)) {
      continue;
    }
    const values = [asset.id, asset.name, ...asset.tags];
    for (const value of values) {
      const token = value.trim();
      if (token.length < 2) {
        continue;
      }
      tokens.add(token);
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return [...tokens]
    .filter((token) => (counts.get(token) ?? 0) <= GENERIC_TOKEN_ASSET_COUNT)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function isGenericToken(token: string): boolean {
  let count = 0;
  for (const asset of assets) {
    if (!isSceneIcon(asset)) {
      continue;
    }
    if (
      asset.name === token ||
      asset.tags.some((tag) => tag === token || tag.toLowerCase() === token.toLowerCase())
    ) {
      count += 1;
      if (count > GENERIC_TOKEN_ASSET_COUNT) {
        return true;
      }
    }
  }
  return false;
}

function isSceneIcon(asset: AssetDefinition): boolean {
  return asset.category !== "hands" && asset.type === "svg";
}

function uniqueFallback(used: Set<string>): AssetDefinition | undefined {
  const icons = assets.filter(isSceneIcon);
  const preferred = FALLBACK_IDS.map((id) => getAsset(id)).filter(
    (asset): asset is AssetDefinition => asset !== undefined && isSceneIcon(asset),
  );
  const preferredIds = new Set<string>(FALLBACK_IDS);
  const rest = icons.filter((asset) => !preferredIds.has(asset.id));
  const queue = [...preferred, ...rest];
  return queue.find((asset) => !used.has(asset.id)) ?? queue[0];
}
