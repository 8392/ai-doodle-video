import {
  assets,
  getAsset,
  searchAssets,
  type AssetDefinition,
} from "@ai-doodle/asset-library";
import {
  assetMatchesTheme,
  inferTheme,
  shortlistAssetsForTheme,
  themeBoost,
  type AssetTheme,
} from "./themes";

const GENERIC_TOKEN_ASSET_COUNT = 8;
const STRONG_SCORE = 4;

export type KeywordSpan = {
  start: number;
  end: number;
  token: string;
};

export type MatchAssetsOptions = {
  theme?: AssetTheme;
  /** Extra candidates (e.g. user uploads mapped as pseudo-assets). */
  extraAssets?: AssetDefinition[];
  scriptContext?: string;
};

export function findKeywordSpans(
  text: string,
  pool: AssetDefinition[] = assets,
): KeywordSpan[] {
  const occupied = new Array<boolean>(text.length).fill(false);
  const spans: KeywordSpan[] = [];
  for (const token of catalogTokens(pool)) {
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

export function resolveAssetsByIds(ids: string[]): AssetDefinition[] {
  const seen = new Set<string>();
  const resolved: AssetDefinition[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    const asset = getAsset(id);
    if (!asset || !isSceneIcon(asset)) {
      continue;
    }
    seen.add(id);
    resolved.push(asset);
  }
  return resolved;
}

export function matchAssetsForNarration(
  narration: string,
  usedAssetIds: string[] = [],
  options: MatchAssetsOptions = {},
): AssetDefinition[] {
  const used = new Set(usedAssetIds);
  const theme =
    options.theme ??
    inferTheme(options.scriptContext ? `${options.scriptContext}\n${narration}` : narration);
  const pool = buildPool(theme, options.extraAssets);

  const fromKeywords = pickFromKeywordSpans(narration, used, pool, theme);
  if (fromKeywords.length > 0) {
    return fromKeywords;
  }

  const ranked = rankAssets(narration, pool, theme);
  const unusedStrong = ranked.filter((asset) => !used.has(asset.id));
  if (unusedStrong[0]) {
    return [unusedStrong[0]];
  }

  const unusedFallback = uniqueFallback(used, narration, pool, theme);
  if (unusedFallback && !used.has(unusedFallback.id)) {
    return [unusedFallback];
  }

  if (ranked[0]) {
    return [ranked[0]];
  }

  return unusedFallback ? [unusedFallback] : [];
}

function buildPool(
  theme: AssetTheme,
  extraAssets: AssetDefinition[] | undefined,
): AssetDefinition[] {
  const base = assets.filter(isSceneIcon);
  const themed = shortlistAssetsForTheme(
    base.filter((asset) => assetMatchesTheme(asset, theme) || theme === "general"),
    theme,
    theme === "general" ? base.length : 180,
  );
  const byId = new Map(themed.map((asset) => [asset.id, asset]));
  for (const asset of extraAssets ?? []) {
    if (isSceneIcon(asset)) {
      byId.set(asset.id, asset);
    }
  }
  // Keep full themed shortlist; if too small, merge remaining matching icons.
  if (byId.size < 40 && theme !== "general") {
    for (const asset of base) {
      if (assetMatchesTheme(asset, theme)) {
        byId.set(asset.id, asset);
      }
    }
  }
  return [...byId.values()];
}

function pickFromKeywordSpans(
  narration: string,
  used: Set<string>,
  pool: AssetDefinition[],
  theme: AssetTheme,
): AssetDefinition[] {
  const picked: AssetDefinition[] = [];
  const pickedIds = new Set<string>();
  for (const span of findKeywordSpans(narration, pool)) {
    if (picked.length >= 3) {
      break;
    }
    const ranked = rankAssets(span.token, pool, theme);
    const next = ranked.find(
      (asset) => !used.has(asset.id) && !pickedIds.has(asset.id),
    );
    if (!next) {
      continue;
    }
    picked.push(next);
    pickedIds.add(next.id);
  }
  return picked;
}

function rankAssets(
  narration: string,
  pool: AssetDefinition[],
  theme: AssetTheme,
): AssetDefinition[] {
  const poolIds = new Set(pool.map((asset) => asset.id));
  const scores = new Map<string, number>();
  for (const token of tokenize(narration)) {
    if (isGenericToken(token, pool)) {
      continue;
    }
    for (const asset of searchInPool(token, pool)) {
      if (!isSceneIcon(asset) || !poolIds.has(asset.id)) {
        continue;
      }
      const points = scoreToken(asset, token) + themeBoost(asset, theme);
      if (scoreToken(asset, token) < STRONG_SCORE) {
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
    .map(([id]) => pool.find((asset) => asset.id === id) ?? getAsset(id))
    .filter((asset): asset is AssetDefinition => Boolean(asset));
}

function searchInPool(token: string, pool: AssetDefinition[]): AssetDefinition[] {
  const fromSearch = searchAssets(token).filter((asset) =>
    pool.some((item) => item.id === asset.id),
  );
  if (fromSearch.length > 0) {
    return fromSearch;
  }
  const lower = token.toLowerCase();
  return pool.filter((asset) => {
    const values = [asset.id, asset.name, ...asset.tags, ...(asset.aliases ?? [])];
    return values.some((value) => value.toLowerCase() === lower || value === token);
  });
}

function scoreToken(asset: AssetDefinition, token: string): number {
  const lower = token.toLowerCase();
  if (asset.name === token || asset.name.toLowerCase() === lower) {
    return 10;
  }
  if (asset.id.toLowerCase() === lower) {
    return 8;
  }
  if (
    asset.tags.some((tag) => tag === token || tag.toLowerCase() === lower) ||
    (asset.aliases ?? []).some((alias) => alias === token || alias.toLowerCase() === lower)
  ) {
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

function catalogTokens(pool: AssetDefinition[]): string[] {
  const counts = new Map<string, number>();
  const tokens = new Set<string>();
  for (const asset of pool) {
    if (!isSceneIcon(asset)) {
      continue;
    }
    const values = [asset.id, asset.name, ...asset.tags, ...(asset.aliases ?? [])];
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

function isGenericToken(token: string, pool: AssetDefinition[]): boolean {
  let count = 0;
  for (const asset of pool) {
    if (!isSceneIcon(asset)) {
      continue;
    }
    if (
      asset.name === token ||
      asset.tags.some((tag) => tag === token || tag.toLowerCase() === token.toLowerCase()) ||
      (asset.aliases ?? []).some(
        (alias) => alias === token || alias.toLowerCase() === token.toLowerCase(),
      )
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

function uniqueFallback(
  used: Set<string>,
  narration: string,
  pool: AssetDefinition[],
  theme: AssetTheme,
): AssetDefinition | undefined {
  const preferred = pool.filter(
    (asset) =>
      !used.has(asset.id) &&
      asset.id !== "globe" &&
      asset.id !== "newspaper" &&
      (theme === "general" || assetMatchesTheme(asset, theme)),
  );
  const symbols = preferred.filter(
    (asset) => asset.category === "objects" || asset.themes?.includes("science"),
  );
  const choices =
    symbols.length > 0
      ? symbols
      : preferred.length > 0
        ? preferred
        : pool.filter((asset) => !used.has(asset.id));
  if (choices.length === 0) {
    return undefined;
  }
  return choices[hashText(narration) % choices.length];
}

function hashText(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export { inferTheme, shortlistAssetsForTheme };
