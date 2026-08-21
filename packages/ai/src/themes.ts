import type { AssetDefinition } from "@ai-doodle/asset-library";

export type AssetTheme =
  | "science"
  | "finance"
  | "product"
  | "tutorial"
  | "geopolitics"
  | "general";

const THEME_PATTERNS: Array<{ theme: AssetTheme; pattern: RegExp }> = [
  {
    theme: "science",
    pattern:
      /温室|气候|变暖|大气|太阳|排放|能效|物理|化学|生物|地球|科学|科普|碳|效应|温度/,
  },
  {
    theme: "finance",
    pattern:
      /市场|股份|资本|现金流|利润|亏损|获客|壁垒|增长|财经|商业|公司|投资|用户/,
  },
  {
    theme: "product",
    pattern: /产品|痛点|方案|导出|旁白|编辑器|讲解视频|白板工程|AI Doodle/,
  },
  {
    theme: "tutorial",
    pattern: /第一步|第二步|第三步|教程|步骤|操作|点击|粘贴文案|培训/,
  },
  {
    theme: "geopolitics",
    pattern:
      /制裁|外交|战争|军队|国旗|总统|条约|中东|北约|导弹|坦克|石油危机|地缘/,
  },
];

/** Categories preferred when a theme is active (others are deprioritized). */
const THEME_CATEGORY_WEIGHT: Record<AssetTheme, Record<string, number>> = {
  science: {
    objects: 3,
    economy: 2,
    industry: 2,
    history: 1,
    media: 1,
    country: -2,
    military: -3,
    diplomacy: -2,
    politics: -1,
  },
  finance: {
    economy: 3,
    industry: 2,
    media: 1,
    people: 1,
    politics: 1,
    military: -2,
    country: -1,
  },
  product: {
    media: 2,
    people: 2,
    objects: 2,
    industry: 2,
    economy: 1,
    military: -2,
    country: -1,
  },
  tutorial: {
    media: 2,
    people: 2,
    objects: 2,
    industry: 1,
    military: -2,
  },
  geopolitics: {
    country: 3,
    military: 3,
    diplomacy: 3,
    politics: 2,
    economy: 1,
    history: 1,
  },
  general: {},
};

export function inferTheme(text: string): AssetTheme {
  const scores = new Map<AssetTheme, number>();
  for (const { theme, pattern } of THEME_PATTERNS) {
    const hits = text.match(new RegExp(pattern.source, "g"));
    if (hits?.length) {
      scores.set(theme, (scores.get(theme) ?? 0) + hits.length);
    }
  }
  let best: AssetTheme = "general";
  let bestScore = 0;
  for (const [theme, score] of scores) {
    if (score > bestScore) {
      best = theme;
      bestScore = score;
    }
  }
  return best;
}

export function themeBoost(asset: AssetDefinition, theme: AssetTheme): number {
  if (theme === "general") {
    return 0;
  }
  const themes = asset.themes ?? [];
  if (themes.includes(theme)) {
    return 6;
  }
  const weight = THEME_CATEGORY_WEIGHT[theme][asset.category] ?? 0;
  return weight;
}

export function assetMatchesTheme(
  asset: AssetDefinition,
  theme: AssetTheme,
): boolean {
  if (theme === "general") {
    return true;
  }
  if (asset.themes?.includes(theme)) {
    return true;
  }
  const weight = THEME_CATEGORY_WEIGHT[theme][asset.category];
  if (weight === undefined) {
    return true;
  }
  return weight >= 0;
}

export function shortlistAssetsForTheme(
  pool: AssetDefinition[],
  theme: AssetTheme,
  limit = 120,
): AssetDefinition[] {
  const scored = pool
    .filter((asset) => asset.category !== "hands" && asset.type === "svg")
    .map((asset) => ({
      asset,
      score: themeBoost(asset, theme) + (asset.themes?.includes(theme) ? 4 : 0),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || a.asset.id.localeCompare(b.asset.id),
    );

  const preferred = scored.filter((item) => item.score >= 0).map((item) => item.asset);
  if (preferred.length >= Math.min(40, limit)) {
    return preferred.slice(0, limit);
  }
  return scored.map((item) => item.asset).slice(0, limit);
}
