export type ScriptTemplate = {
  id: string;
  label: string;
  blurb: string;
  language: "zh" | "en";
  aspect: "9:16" | "16:9" | "1:1";
  style: "whiteboard" | "blackboard" | "line";
  script: string;
};

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "science",
    label: "科普",
    blurb: "把复杂概念拆成三步讲清楚",
    language: "zh",
    aspect: "9:16",
    style: "whiteboard",
    script: [
      "什么是温室效应？",
      "太阳光进入地球大气层，地面吸收后向外散热。",
      "温室气体像毯子一样把热量留住，温度因此上升。",
      "煤炭石油燃烧会增加温室气体，加速全球变暖。",
      "减少排放、提高能效，是减缓变暖的关键路径。",
    ].join(""),
  },
  {
    id: "finance",
    label: "财经",
    blurb: "用对比讲清一条商业逻辑",
    language: "zh",
    aspect: "16:9",
    style: "line",
    script: [
      "为什么有些公司宁愿亏钱也要抢市场份额？",
      "短期亏损换来用户规模，形成网络效应。",
      "一旦用户习惯养成，后来者获客成本会陡增。",
      "资本用时间买壁垒，利润往往出现在第二阶段。",
      "因此看这类公司，要同时看增长质量和现金流。",
    ].join(""),
  },
  {
    id: "product",
    label: "产品介绍",
    blurb: "痛点 → 方案 → 价值，一分钟讲完",
    language: "zh",
    aspect: "9:16",
    style: "whiteboard",
    script: [
      "做讲解视频最麻烦的是什么？",
      "写稿、找图、配音、对齐时间轴，常常要花一整天。",
      "AI Doodle 输入文案就能生成可编辑的白板工程。",
      "你可以改每一场画面、重配旁白，再一键导出。",
      "适合科普、培训和产品讲解，从想法到成片更快。",
    ].join(""),
  },
  {
    id: "tutorial",
    label: "教程",
    blurb: "步骤化教学，适合培训与操作指南",
    language: "zh",
    aspect: "16:9",
    style: "blackboard",
    script: [
      "今天教你三步完成一次白板视频导出。",
      "第一步：在创建页粘贴文案，选择比例和音色。",
      "第二步：进入编辑器，调整图标、文字和镜头。",
      "第三步：点击导出 MP4，失败时可改用云端导出。",
      "记住：改完旁白文案后，一定要重新合成本场语音。",
    ].join(""),
  },
];

export function findScriptTemplate(id: string): ScriptTemplate | undefined {
  return SCRIPT_TEMPLATES.find((item) => item.id === id);
}
