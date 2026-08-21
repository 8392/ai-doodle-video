/**
 * Optional metadata overlays merged onto catalog assets at registry load time.
 * Prefer enriching aliases/themes here over regenerating pack JSON.
 */
export type AssetMetaOverlay = {
  id: string;
  aliases?: string[];
  themes?: string[];
  pack?: string;
  license?: string;
  source?: string;
  category?: string;
  tags?: string[];
};

export const assetMetaOverlays: AssetMetaOverlay[] = [
  {
    id: "globe",
    aliases: ["地球", "大气", "全球", "世界", "变暖", "气候", "温室效应", "温室"],
    themes: ["science", "geopolitics"],
    tags: ["地球", "全球", "气候"],
  },
  {
    id: "gas",
    aliases: ["温室气体", "排放", "二氧化碳", "CO2", "carbon", "blanket", "毯子"],
    themes: ["science", "finance"],
    tags: ["天然气", "温室气体", "排放"],
  },
  {
    id: "oil",
    aliases: ["石油", "煤炭", "化石燃料", "燃烧", "能源"],
    themes: ["science", "finance", "geopolitics"],
  },
  {
    id: "oil-factory",
    aliases: ["工厂", "燃烧", "煤炭", "炼油", "排放"],
    themes: ["science", "finance"],
  },
  {
    id: "oil-barrel",
    aliases: ["油桶", "化石燃料", "石油"],
    themes: ["science", "finance", "geopolitics"],
  },
  {
    id: "sundial",
    aliases: ["太阳", "阳光", "日光", "sun", "solar"],
    themes: ["science", "history"],
  },
  {
    id: "chip",
    aliases: ["芯片", "半导体", "科技", "电路"],
    themes: ["product", "tutorial", "finance"],
  },
  {
    id: "law-book",
    aliases: ["书", "定义", "概念", "教程", "手册"],
    themes: ["tutorial", "product", "science"],
  },
  {
    id: "megaphone",
    aliases: ["讲解", "宣传", "旁白", "广播"],
    themes: ["product", "tutorial", "media"],
  },
  {
    id: "microphone",
    aliases: ["配音", "旁白", "语音", "采访"],
    themes: ["product", "tutorial"],
  },
  {
    id: "rare-earth",
    aliases: ["矿产", "资源", "材料"],
    themes: ["science", "finance"],
  },
  {
    id: "earthquake",
    aliases: ["灾害", "地质", "震动"],
    themes: ["science"],
  },
  {
    id: "usa",
    themes: ["geopolitics"],
  },
  {
    id: "iran",
    themes: ["geopolitics"],
  },
  {
    id: "china",
    themes: ["geopolitics"],
  },
  {
    id: "sanctions",
    aliases: ["制裁", "禁运", "限制"],
    themes: ["geopolitics", "finance"],
  },
  {
    id: "tanker",
    themes: ["geopolitics", "finance"],
  },
  {
    id: "newspaper",
    aliases: ["媒体", "新闻", "报道"],
    themes: ["product", "tutorial"],
  },
];
