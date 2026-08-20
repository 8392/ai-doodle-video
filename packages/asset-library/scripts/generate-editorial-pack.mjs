import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const publicRoot = path.join(repoRoot, "public/assets");
const packJson = path.join(here, "../src/editorial-pack.json");

const INK = "#171717";
const C = {
  blue: "#3E8CC5",
  red: "#C45C3E",
  gold: "#D4A017",
  sage: "#6B8F71",
  cream: "#F4F1EA",
  sand: "#E4D5B7",
  slate: "#5C6B7A",
  white: "#F7F4EE",
  navy: "#2C4A6E",
  bronze: "#A67C52",
};

const EXISTING = new Set([
  "usa", "iran", "china", "russia", "india", "japan", "uk", "germany", "saudi",
  "businessman", "worker", "politician", "soldier", "crowd", "money", "dollar",
  "bank", "stock", "chart", "coins", "wallet", "embargo", "factory", "oil",
  "oil-factory", "pipeline", "power", "oil-barrel", "derrick", "tanker", "phone",
  "computer", "car", "house", "money-box", "globe", "plane", "ship", "newspaper",
  "chain", "missile", "government", "election", "flag", "sanctions", "capitol",
  "gavel", "un", "arrow", "lock", "hand-right", "hand-left",
]);

function circle(cx, cy, r) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}
function rect(x, y, w, h) {
  return `M${x} ${y}h${w}v${h}h${-w}z`;
}
function roundRect(x, y, w, h, r = 14) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + rr} ${y}h${w - rr * 2}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${h - rr * 2}a${rr} ${rr} 0 0 1 ${-rr} ${rr}h${-(w - rr * 2)}a${rr} ${rr} 0 0 1 ${-rr} ${-rr}v${-(h - rr * 2)}a${rr} ${rr} 0 0 1 ${rr} ${-rr}z`;
}
function line(x1, y1, x2, y2) {
  return `M${x1} ${y1}L${x2} ${y2}`;
}
function poly(points) {
  const [first, ...rest] = points;
  return `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join("")}Z`;
}
function star(cx, cy, r, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return poly(pts);
}
function p(d, fill = "none", sw) {
  return { d, fill, sw };
}

function framed(inner) {
  return [
    p(roundRect(22, 28, 196, 184, 22), C.cream, 3),
    p(roundRect(34, 40, 172, 160, 16), C.white, 2.4),
    ...inner,
  ];
}

function flag(colors, layout) {
  const x = 40;
  const y = 58;
  const w = 160;
  const h = 112;
  const layers = [
    p(roundRect(28, 44, 184, 152, 18), C.sand, 3),
    p(rect(x, y, w, h), colors[0] ?? C.blue, 2.6),
  ];
  if (layout === "v2") {
    layers.push(p(rect(x + w / 2, y, w / 2, h), colors[1], 2.4));
  } else if (layout === "v3") {
    layers.push(p(rect(x + w / 3, y, w / 3, h), colors[1], 2.4));
    layers.push(p(rect(x + (2 * w) / 3, y, w / 3, h), colors[2], 2.4));
  } else if (layout === "h2") {
    layers.push(p(rect(x, y + h / 2, w, h / 2), colors[1], 2.4));
  } else if (layout === "h3") {
    layers.push(p(rect(x, y + h / 3, w, h / 3), colors[1], 2.4));
    layers.push(p(rect(x, y + (2 * h) / 3, w, h / 3), colors[2], 2.4));
  } else if (layout === "disc") {
    layers.push(p(circle(120, 114, 28), colors[1], 2.4));
  } else if (layout === "nordic") {
    layers.push(p(rect(x + 48, y, 22, h), colors[1], 2.2));
    layers.push(p(rect(x, y + 45, w, 22), colors[1], 2.2));
  } else if (layout === "canton") {
    layers.push(p(rect(x, y + h / 2, w, h / 2), colors[1], 2.2));
    layers.push(p(rect(x, y, 64, h / 2), colors[2] ?? C.navy, 2.2));
    layers.push(p(star(72, y + 28, 12), C.cream, 1.8));
  } else if (layout === "crescent") {
    layers.push(p(circle(118, 114, 26), colors[1], 2.2));
    layers.push(p(circle(128, 110, 18), colors[0], 0.01));
    layers.push(p(star(148, 108, 10), colors[1], 1.8));
  } else if (layout === "star") {
    layers.push(p(star(120, 114, 32), colors[1], 2.2));
  } else if (layout === "sun") {
    layers.push(p(circle(120, 114, 22), colors[1], 2.2));
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      layers.push(
        p(
          line(
            120 + Math.cos(a) * 30,
            114 + Math.sin(a) * 30,
            120 + Math.cos(a) * 46,
            114 + Math.sin(a) * 46,
          ),
          "none",
          2.4,
        ),
      );
    }
  } else if (layout === "trident") {
    layers.push(p(rect(x, y + h / 2, w, h / 2), colors[1], 2.2));
    layers.push(p("M120 78 L120 128 M102 92 L120 78 L138 92 M108 128 L120 118 L132 128", "none", 3));
  } else if (layout === "maple") {
    layers.push(p("M120 72 L132 96 L156 92 L140 112 L152 136 L120 122 L88 136 L100 112 L84 92 L108 96 Z", colors[1], 2.4));
  } else if (layout === "cross") {
    layers.push(p(rect(x + 68, y + 16, 24, h - 32), colors[1], 2.2));
    layers.push(p(rect(x + 16, y + 44, w - 32, 24), colors[1], 2.2));
  }
  layers.push(p(rect(x, y, w, h), "none", 3));
  return layers;
}

function ground() {
  return [p(line(28, 196, 212, 196), "none", 3)];
}

function landmark(kind) {
  const g = ground();
  if (kind === "pyramid") {
    return [...g, p(poly([[120, 52], [196, 196], [44, 196]]), C.sand, 3)];
  }
  if (kind === "sphinx") {
    return [
      ...g,
      p(rect(70, 128, 120, 68), C.sand, 2.6),
      p(circle(96, 118, 28), C.sand, 2.6),
      p(line(84, 112, 108, 112), "none", 2.2),
      p(poly([[190, 196], [190, 150], [214, 196]]), C.sand, 2.4),
    ];
  }
  if (kind === "columns") {
    return [
      ...g,
      p(poly([[48, 86], [120, 44], [192, 86]]), C.cream, 2.8),
      p(rect(52, 86, 136, 14), C.sand, 2.4),
      ...[64, 92, 120, 148, 176].map((x) => p(rect(x - 8, 100, 16, 80), C.cream, 2.2)),
      p(rect(44, 180, 152, 16), C.sand, 2.4),
    ];
  }
  if (kind === "colosseum") {
    return [
      ...g,
      p(roundRect(44, 88, 152, 108, 20), C.sand, 3),
      ...[70, 100, 130, 160].map((x) => p(`M${x} 188 C${x} 150 ${x + 20} 150 ${x + 20} 188`, "none", 2.4)),
      p(line(44, 128, 196, 128), "none", 2.2),
    ];
  }
  if (kind === "pagoda") {
    return [
      ...g,
      p(poly([[70, 88], [170, 88], [156, 108], [84, 108]]), C.red, 2.4),
      p(poly([[58, 118], [182, 118], [166, 140], [74, 140]]), C.red, 2.4),
      p(poly([[46, 150], [194, 150], [176, 178], [64, 178]]), C.red, 2.4),
      p(rect(102, 178, 36, 18), C.sand, 2.2),
      p(line(120, 52, 120, 88), "none", 2.6),
    ];
  }
  if (kind === "castle") {
    return [
      ...g,
      p(rect(52, 108, 136, 88), C.slate, 2.8),
      p(rect(44, 84, 36, 112), C.slate, 2.6),
      p(rect(160, 84, 36, 112), C.slate, 2.6),
      p(poly([[44, 84], [62, 58], [80, 84]]), C.red, 2.2),
      p(poly([[160, 84], [178, 58], [196, 84]]), C.red, 2.2),
      p("M68 108 h16 v-16 h16 v16 h16 v-16 h16 v16 h16 v-16 h16 v16", "none", 2.4),
      p(rect(104, 140, 32, 56), C.cream, 2.2),
    ];
  }
  if (kind === "mosque") {
    return [
      ...g,
      p(`M72 196 V120 A48 48 0 0 1 168 120 V196`, C.sage, 2.8),
      p(circle(120, 92, 22), C.gold, 2.4),
      p(rect(40, 108, 18, 88), C.sage, 2.4),
      p(rect(182, 108, 18, 88), C.sage, 2.4),
      p(circle(49, 100, 10), C.gold, 2),
      p(circle(191, 100, 10), C.gold, 2),
    ];
  }
  if (kind === "cathedral") {
    return [
      ...g,
      p(poly([[48, 196], [48, 120], [120, 52], [192, 120], [192, 196]]), C.slate, 2.8),
      p(`M88 196 V140 A32 40 0 0 1 152 140 V196`, C.cream, 2.4),
      p(line(120, 52, 120, 28), "none", 2.4),
      p(circle(120, 24, 6), C.gold, 2),
    ];
  }
  if (kind === "wall") {
    return [
      ...g,
      p("M28 168 C60 148 90 176 120 156 C150 136 180 164 212 144 L212 196 L28 196 Z", C.sand, 2.8),
      p("M50 150 v-18 M86 158 v-18 M128 148 v-18 M170 156 v-18", "none", 2.6),
    ];
  }
  if (kind === "tower") {
    return [
      ...g,
      p(poly([[120, 36], [148, 196], [92, 196]]), C.bronze, 2.8),
      p(line(104, 88, 136, 88), "none", 2.2),
      p(line(98, 128, 142, 128), "none", 2.2),
      p(line(94, 164, 146, 164), "none", 2.2),
    ];
  }
  if (kind === "obelisk") {
    return [
      ...g,
      p(poly([[120, 36], [142, 196], [98, 196]]), C.sand, 3),
      p(poly([[120, 36], [128, 58], [112, 58]]), C.gold, 2.2),
    ];
  }
  if (kind === "forbidden") {
    return [
      ...g,
      p(poly([[40, 120], [200, 120], [188, 148], [52, 148]]), C.red, 2.6),
      p(rect(64, 148, 112, 48), C.sand, 2.4),
      p(rect(108, 160, 24, 36), C.cream, 2.2),
      p(line(36, 100, 204, 100), "none", 3),
      p(poly([[88, 88], [152, 88], [140, 108], [100, 108]]), C.gold, 2.2),
    ];
  }
  if (kind === "statue") {
    return [
      ...g,
      p(rect(88, 176, 64, 20), C.sand, 2.4),
      p(rect(108, 100, 24, 76), C.slate, 2.4),
      p(circle(120, 82, 20), C.slate, 2.4),
      p(line(120, 62, 120, 36), "none", 2.6),
      p(rect(114, 28, 12, 10), C.gold, 2),
    ];
  }
  if (kind === "ruins") {
    return [
      ...g,
      p(rect(48, 120, 22, 76), C.sand, 2.4),
      p(rect(86, 96, 22, 100), C.sand, 2.4),
      p(rect(132, 132, 22, 64), C.sand, 2.4),
      p(rect(170, 108, 22, 88), C.sand, 2.4),
      p(line(48, 118, 192, 104), "none", 2.2),
    ];
  }
  if (kind === "bridge") {
    return [
      ...g,
      p("M28 148 C80 88 160 88 212 148", "none", 3.2),
      p(line(28, 148, 212, 148), "none", 2.8),
      p(line(68, 148, 68, 118), "none", 2.4),
      p(line(120, 148, 120, 96), "none", 2.4),
      p(line(172, 148, 172, 118), "none", 2.4),
      p(rect(28, 148, 184, 12), C.slate, 2.2),
    ];
  }
  if (kind === "dam") {
    return [
      ...g,
      p(poly([[40, 64], [200, 64], [188, 196], [52, 196]]), C.slate, 2.8),
      p(line(56, 96, 184, 96), "none", 2.2),
      p(line(60, 128, 180, 128), "none", 2.2),
      p(line(64, 160, 176, 160), "none", 2.2),
      p("M120 196 C108 176 108 156 120 140 C132 156 132 176 120 196", C.blue, 2.2),
    ];
  }
  if (kind === "temple") {
    return [
      ...g,
      p(poly([[44, 100], [120, 48], [196, 100]]), C.gold, 2.8),
      p(rect(60, 100, 120, 80), C.cream, 2.4),
      p(rect(108, 132, 24, 48), C.red, 2.2),
      p(line(80, 100, 80, 180), "none", 2.2),
      p(line(160, 100, 160, 180), "none", 2.2),
    ];
  }
  if (kind === "church") {
    return [
      ...g,
      p(rect(72, 100, 96, 96), C.cream, 2.6),
      p(poly([[72, 100], [120, 60], [168, 100]]), C.slate, 2.6),
      p(line(120, 60, 120, 36), "none", 2.6),
      p(line(108, 48, 132, 48), "none", 2.6),
      p(rect(108, 148, 24, 48), C.sand, 2.2),
    ];
  }
  return [...g, p(rect(70, 80, 100, 116), C.slate, 2.8)];
}

function vehicle(kind) {
  if (kind === "tank") {
    return [
      p(roundRect(40, 108, 160, 44, 12), C.sage, 2.8),
      p(roundRect(72, 78, 88, 36, 10), C.sage, 2.6),
      p(line(160, 92, 214, 78), "none", 3.2),
      p(circle(70, 160, 18), C.slate, 2.4),
      p(circle(120, 164, 20), C.slate, 2.4),
      p(circle(170, 160, 18), C.slate, 2.4),
    ];
  }
  if (kind === "submarine") {
    return [
      p("M36 128 C48 92 192 92 208 128 C192 156 48 156 36 128 Z", C.navy, 2.8),
      p(rect(108, 84, 28, 24), C.navy, 2.4),
      p(line(122, 84, 122, 64), "none", 2.4),
      p(circle(70, 124, 8), C.cream, 2),
      p(circle(96, 124, 8), C.cream, 2),
    ];
  }
  if (kind === "fighter") {
    return [
      p(poly([[28, 128], [150, 112], [214, 120], [150, 128], [120, 156], [100, 128]]), C.slate, 2.8),
      p(line(86, 120, 64, 88), "none", 2.6),
      p(line(86, 128, 64, 160), "none", 2.6),
      p(circle(138, 120, 6), C.red, 2),
    ];
  }
  if (kind === "carrier") {
    return [
      p(poly([[24, 140], [216, 128], [208, 164], [32, 172]]), C.navy, 2.8),
      p(rect(88, 108, 64, 28), C.slate, 2.4),
      p(line(48, 136, 190, 128), "none", 2.4),
      p(poly([[160, 120], [188, 112], [176, 128]]), C.cream, 2),
    ];
  }
  if (kind === "helicopter") {
    return [
      p(roundRect(72, 108, 100, 36, 14), C.slate, 2.6),
      p(circle(92, 126, 16), C.cream, 2.2),
      p(line(120, 108, 120, 72), "none", 2.6),
      p(line(48, 72, 192, 72), "none", 3),
      p(line(172, 124, 214, 124), "none", 2.8),
      p(rect(88, 144, 12, 16), C.slate, 2),
      p(rect(140, 144, 12, 16), C.slate, 2),
    ];
  }
  if (kind === "drone") {
    return [
      p(circle(120, 120, 22), C.slate, 2.6),
      p(line(120, 98, 120, 64), "none", 2.4),
      p(circle(64, 72, 16), "none", 2.6),
      p(circle(176, 72, 16), "none", 2.6),
      p(circle(64, 168, 16), "none", 2.6),
      p(circle(176, 168, 16), "none", 2.6),
      p(line(104, 108, 76, 84), "none", 2.4),
      p(line(136, 108, 164, 84), "none", 2.4),
      p(line(104, 132, 76, 156), "none", 2.4),
      p(line(136, 132, 164, 156), "none", 2.4),
    ];
  }
  if (kind === "warship") {
    return [
      p(poly([[28, 140], [60, 140], [80, 100], [160, 100], [180, 140], [212, 140], [200, 168], [40, 168]]), C.navy, 2.8),
      p(rect(108, 64, 16, 36), C.slate, 2.4),
      p(line(116, 64, 116, 44), "none", 2.4),
    ];
  }
  if (kind === "rocket") {
    return [
      p(poly([[120, 28], [148, 88], [148, 176], [92, 176], [92, 88]]), C.white, 2.8),
      p(poly([[92, 176], [120, 216], [148, 176]]), C.red, 2.6),
      p(poly([[92, 120], [64, 156], [92, 148]]), C.navy, 2.4),
      p(poly([[148, 120], [176, 156], [148, 148]]), C.navy, 2.4),
      p(circle(120, 108, 10), C.blue, 2.2),
    ];
  }
  if (kind === "train") {
    return [
      p(roundRect(40, 88, 160, 72, 16), C.navy, 2.8),
      p(rect(52, 100, 44, 32), C.cream, 2.2),
      p(rect(108, 100, 44, 32), C.cream, 2.2),
      p(circle(76, 172, 16), C.slate, 2.4),
      p(circle(164, 172, 16), C.slate, 2.4),
      p(line(40, 140, 200, 140), "none", 2.4),
    ];
  }
  if (kind === "truck") {
    return [
      p(roundRect(28, 96, 120, 64, 10), C.slate, 2.6),
      p(poly([[148, 112], [196, 112], [208, 160], [148, 160]]), C.navy, 2.6),
      p(rect(160, 120, 28, 20), C.cream, 2),
      p(circle(72, 172, 16), C.ink, 2.4),
      p(circle(176, 172, 16), C.ink, 2.4),
    ];
  }
  return [p(roundRect(48, 100, 144, 56, 12), C.slate, 2.8)];
}

function emblem(symbol) {
  const ring = [
    p(circle(120, 120, 88), C.cream, 3),
    p(circle(120, 120, 74), C.white, 2.4),
  ];
  if (symbol === "scales") {
    return [...ring, p("M120 72 L120 168 M84 96 H156 M84 96 L68 128 H100 Z M156 96 L172 128 H140 Z", "none", 2.8)];
  }
  if (symbol === "olive") {
    return [...ring, p("M120 168 C84 140 84 92 120 72 C156 92 156 140 120 168", C.sage, 2.6), p(line(120, 72, 120, 168), "none", 2.4)];
  }
  if (symbol === "star") {
    return [...ring, p(star(120, 120, 40), C.gold, 2.6)];
  }
  if (symbol === "atom") {
    return [
      ...ring,
      p(circle(120, 120, 8), C.blue, 2),
      p("M70 120 A50 22 0 1 0 170 120 A50 22 0 1 0 70 120", "none", 2.4),
      p("M90 78 A22 50 0 1 0 150 162 A22 50 0 1 0 90 78", "none", 2.4),
    ];
  }
  if (symbol === "chip") {
    return [
      ...ring,
      p(roundRect(84, 84, 72, 72, 8), C.navy, 2.6),
      p(roundRect(100, 100, 40, 40, 4), C.gold, 2.2),
      ...[92, 108, 124, 140].flatMap((y) => [
        p(line(70, y, 84, y), "none", 2.2),
        p(line(156, y, 170, y), "none", 2.2),
      ]),
    ];
  }
  if (symbol === "nato") {
    return [...ring, p(star(120, 120, 36, 4), C.navy, 2.6), p(circle(120, 120, 10), C.cream, 2)];
  }
  if (symbol === "eu") {
    return [
      ...ring,
      p(circle(120, 120, 58), C.navy, 2.2),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 6;
        return p(star(120 + Math.cos(a) * 44, 120 + Math.sin(a) * 44, 6), C.gold, 1.4);
      }),
    ];
  }
  if (symbol === "handshake") {
    return [...ring, p("M64 128 C84 108 96 112 110 124 L120 132 L130 124 C144 112 156 108 176 128", "none", 3), p(roundRect(70, 118, 36, 22, 8), C.sand, 2.2), p(roundRect(134, 118, 36, 22, 8), C.sand, 2.2)];
  }
  if (symbol === "dove") {
    return [...ring, p("M64 132 C92 92 140 84 184 108 L160 120 C148 112 128 116 120 128 C132 124 150 132 168 148 L96 140 C80 148 70 144 64 132 Z", C.white, 2.6)];
  }
  if (symbol === "key") {
    return [...ring, p(circle(96, 120, 18), "none", 2.8), p(line(114, 120, 168, 120), "none", 2.8), p(line(150, 120, 150, 136), "none", 2.6), p(line(162, 120, 162, 132), "none", 2.6)];
  }
  if (symbol === "eye") {
    return [...ring, p("M56 120 C84 84 156 84 184 120 C156 156 84 156 56 120 Z", C.white, 2.6), p(circle(120, 120, 16), C.navy, 2.2)];
  }
  return [...ring, p(circle(120, 120, 28), C.blue, 2.6)];
}

function person(prop) {
  const body = [
    p(circle(120, 62, 22), C.sand, 2.6),
    p("M78 196 C78 128 162 128 162 196", C.navy, 2.8),
  ];
  if (prop === "crown") {
    return [p(poly([[92, 46], [100, 28], [120, 40], [140, 28], [148, 46]]), C.gold, 2.4), ...body];
  }
  if (prop === "briefcase") {
    return [...body, p(roundRect(158, 132, 40, 28, 4), C.bronze, 2.4), p(line(170, 132, 170, 124), "none", 2.2)];
  }
  if (prop === "mic") {
    return [...body, p(roundRect(168, 92, 18, 36, 9), C.slate, 2.4), p(line(177, 128, 177, 156), "none", 2.4)];
  }
  if (prop === "rifle") {
    return [...body, p(line(70, 150, 200, 92), "none", 3), p(rect(176, 84, 28, 10), C.slate, 2)];
  }
  if (prop === "camera") {
    return [...body, p(roundRect(154, 108, 52, 36, 6), C.slate, 2.4), p(circle(180, 126, 10), C.cream, 2)];
  }
  if (prop === "gavel") {
    return [...body, p(rect(160, 100, 36, 14), C.bronze, 2.4), p(line(178, 114, 178, 150), "none", 2.6)];
  }
  if (prop === "scroll") {
    return [...body, p(roundRect(154, 116, 48, 36, 10), C.sand, 2.4)];
  }
  if (prop === "flask") {
    return [...body, p("M168 96 h24 v16 l12 44 h-48 l12 -44 z", C.sage, 2.4)];
  }
  if (prop === "hat") {
    return [p(ellipseHat(), C.ink, 2.4), ...body];
  }
  if (prop === "banner") {
    return [...body, p(rect(52, 72, 8, 124), C.bronze, 2.2), p(poly([[60, 72], [120, 72], [108, 100], [60, 100]]), C.red, 2.2)];
  }
  return body;
}

function ellipseHat() {
  return `M78 48 C78 36 162 36 162 48 L168 52 L72 52 Z`;
}

function objectIcon(kind) {
  if (kind === "crown") {
    return [
      p(poly([[48, 148], [64, 72], [92, 112], [120, 56], [148, 112], [176, 72], [192, 148]]), C.gold, 2.8),
      p(rect(48, 148, 144, 24), C.gold, 2.6),
      p(circle(120, 52, 8), C.red, 2),
    ];
  }
  if (kind === "scroll") {
    return [
      p(roundRect(52, 56, 136, 128, 18), C.sand, 2.8),
      p(line(76, 92, 164, 92), "none", 2.4),
      p(line(76, 116, 164, 116), "none", 2.4),
      p(line(76, 140, 140, 140), "none", 2.4),
    ];
  }
  if (kind === "hourglass") {
    return [
      p(rect(72, 48, 96, 18), C.bronze, 2.6),
      p(rect(72, 174, 96, 18), C.bronze, 2.6),
      p("M84 66 L156 66 L120 120 Z", C.sand, 2.4),
      p("M84 174 L156 174 L120 120 Z", C.sand, 2.4),
    ];
  }
  if (kind === "sword") {
    return [
      p(line(120, 36, 120, 168), "none", 3.2),
      p(poly([[120, 28], [132, 48], [108, 48]]), C.slate, 2.4),
      p(line(84, 156, 156, 156), "none", 3),
      p(rect(108, 168, 24, 28), C.bronze, 2.4),
    ];
  }
  if (kind === "shield") {
    return [
      p("M120 36 L184 64 V124 C184 168 120 204 120 204 C120 204 56 168 56 124 V64 Z", C.navy, 3),
      p(star(120, 120, 24), C.gold, 2.2),
    ];
  }
  if (kind === "cannon") {
    return [
      p(roundRect(40, 108, 140, 32, 10), C.slate, 2.8),
      p(circle(64, 160, 22), C.ink, 2.6),
      p(rect(36, 96, 24, 24), C.slate, 2.4),
      p(circle(188, 124, 10), C.sand, 2),
    ];
  }
  if (kind === "passport") {
    return [
      p(roundRect(64, 40, 112, 160, 12), C.navy, 3),
      p(circle(120, 100, 24), "none", 2.6),
      p(line(88, 100, 152, 100), "none", 2.2),
      p(line(120, 76, 120, 124), "none", 2.2),
      p(line(80, 148, 160, 148), "none", 2.2),
    ];
  }
  if (kind === "ballot") {
    return [
      p(roundRect(56, 88, 128, 108, 8), C.sand, 2.8),
      p(rect(88, 64, 64, 40), C.cream, 2.4),
      p(line(88, 88, 152, 88), "none", 2.6),
      p("M100 140 L112 152 L140 120", "none", 3),
    ];
  }
  if (kind === "podium") {
    return [
      p(poly([[64, 196], [80, 120], [160, 120], [176, 196]]), C.navy, 2.8),
      p(rect(72, 104, 96, 16), C.gold, 2.4),
      p(circle(120, 72, 18), C.sand, 2.4),
    ];
  }
  if (kind === "mic") {
    return [
      p(roundRect(96, 36, 48, 88, 24), C.slate, 2.8),
      p(line(120, 124, 120, 168), "none", 3),
      p(line(88, 168, 152, 168), "none", 3),
      p("M84 80 C84 120 156 120 156 80", "none", 2.6),
    ];
  }
  if (kind === "camera") {
    return [
      p(roundRect(44, 84, 152, 92, 12), C.slate, 2.8),
      p(circle(120, 130, 28), C.cream, 2.6),
      p(circle(120, 130, 14), C.navy, 2.2),
      p(rect(60, 72, 36, 16), C.slate, 2.2),
    ];
  }
  if (kind === "tv") {
    return [
      p(roundRect(40, 56, 160, 112, 12), C.navy, 2.8),
      p(rect(56, 72, 128, 80), C.cream, 2.4),
      p(line(88, 168, 88, 196), "none", 2.6),
      p(line(152, 168, 152, 196), "none", 2.6),
      p(line(72, 196, 168, 196), "none", 2.6),
    ];
  }
  if (kind === "radio") {
    return [
      p(roundRect(48, 84, 144, 96, 12), C.bronze, 2.8),
      p(circle(96, 132, 22), C.cream, 2.4),
      p(circle(156, 124, 10), C.navy, 2),
      p(circle(156, 148, 10), C.navy, 2),
      p(line(72, 84, 120, 44), "none", 2.6),
    ];
  }
  if (kind === "satellite") {
    return [
      p(poly([[120, 88], [176, 48], [188, 64], [132, 104]]), C.blue, 2.6),
      p(poly([[120, 152], [64, 192], [52, 176], [108, 136]]), C.blue, 2.6),
      p(circle(120, 120, 18), C.gold, 2.6),
      p(line(120, 102, 120, 72), "none", 2.4),
    ];
  }
  if (kind === "chip") {
    return [
      p(roundRect(64, 64, 112, 112, 10), C.navy, 3),
      p(roundRect(88, 88, 64, 64, 6), C.gold, 2.4),
      ...[80, 104, 128, 152].flatMap((v) => [
        p(line(48, v, 64, v), "none", 2.4),
        p(line(176, v, 192, v), "none", 2.4),
        p(line(v, 48, v, 64), "none", 2.4),
        p(line(v, 176, v, 192), "none", 2.4),
      ]),
    ];
  }
  if (kind === "oil-drop") {
    return [p("M120 36 C164 92 176 140 120 196 C64 140 76 92 120 36 Z", C.slate, 2.8)];
  }
  if (kind === "flame") {
    return [p("M120 40 C92 92 72 120 88 156 C100 184 140 184 152 156 C168 120 148 92 120 40 Z", C.red, 2.8), p("M120 92 C108 120 112 148 120 164 C128 148 132 120 120 92 Z", C.gold, 2.2)];
  }
  if (kind === "wind") {
    return [
      p(line(120, 196, 120, 88), "none", 3),
      p(circle(120, 80, 10), C.slate, 2.4),
      p("M120 80 L176 52 L120 80 L164 112 Z", C.cream, 2.4),
      p("M120 80 L80 44 L120 80 L64 88 Z", C.cream, 2.4),
      p("M120 80 L132 140 L120 80 L88 136 Z", C.cream, 2.4),
    ];
  }
  if (kind === "solar") {
    return [
      p(roundRect(52, 72, 136, 96, 8), C.navy, 2.8),
      p(line(52, 104, 188, 104), "none", 2.2),
      p(line(52, 136, 188, 136), "none", 2.2),
      p(line(96, 72, 96, 168), "none", 2.2),
      p(line(144, 72, 144, 168), "none", 2.2),
      p(line(88, 168, 72, 196), "none", 2.4),
      p(line(152, 168, 168, 196), "none", 2.4),
    ];
  }
  if (kind === "atom-plant") {
    return [
      ...ground(),
      p(rect(48, 120, 40, 76), C.slate, 2.6),
      p(rect(152, 120, 40, 76), C.slate, 2.6),
      p("M88 120 C88 72 152 72 152 120", C.cream, 2.6),
      p(circle(120, 108, 10), C.gold, 2.2),
    ];
  }
  if (kind === "gold") {
    return [
      p(poly([[48, 148], [88, 108], [152, 108], [192, 148], [168, 180], [72, 180]]), C.gold, 2.8),
      p(line(88, 108, 72, 180), "none", 2.2),
      p(line(152, 108, 168, 180), "none", 2.2),
    ];
  }
  if (kind === "yuan") {
    return [
      p(circle(120, 120, 84), C.red, 3),
      p("M84 96 H156 M120 80 V160 M92 128 H148", C.gold, 3.2),
    ];
  }
  if (kind === "euro") {
    return [
      p(circle(120, 120, 84), C.navy, 3),
      p("M148 84 C100 72 76 108 100 120 C76 132 100 168 148 156 M70 110 H124 M70 130 H124", C.gold, 3),
    ];
  }
  if (kind === "yen") {
    return [
      p(circle(120, 120, 84), C.red, 3),
      p("M88 80 L120 120 L152 80 M120 120 V168 M92 132 H148 M92 148 H148", C.white, 3),
    ];
  }
  if (kind === "container") {
    return [
      p(rect(36, 88, 168, 88, ), C.blue, 2.8),
      p(line(78, 88, 78, 176), "none", 2.4),
      p(line(120, 88, 120, 176), "none", 2.4),
      p(line(162, 88, 162, 176), "none", 2.4),
      p(rect(36, 176, 168, 16), C.slate, 2.4),
    ];
  }
  if (kind === "mountain") {
    return [
      p(poly([[28, 196], [84, 72], [120, 128], [156, 64], [212, 196]]), C.slate, 2.8),
      p(poly([[84, 72], [100, 96], [72, 96]]), C.cream, 2.2),
      p(poly([[156, 64], [172, 88], [144, 88]]), C.cream, 2.2),
    ];
  }
  if (kind === "wave") {
    return [
      p("M28 120 C60 80 84 80 116 120 C148 160 172 160 212 120", "none", 3.2),
      p("M28 156 C60 116 84 116 116 156 C148 196 172 196 212 156", "none", 3.2),
      p("M28 84 C60 44 84 44 116 84 C148 124 172 124 212 84", "none", 2.6),
    ];
  }
  if (kind === "strait") {
    return [
      p("M28 48 C80 80 80 160 28 196", C.sand, 2.8),
      p("M212 48 C160 80 160 160 212 196", C.sand, 2.8),
      p("M86 120 C120 100 120 140 154 120", "none", 3),
    ];
  }
  if (kind === "canal") {
    return [
      p(rect(28, 96, 184, 48), C.blue, 2.6),
      p(rect(88, 64, 16, 112), C.sand, 2.6),
      p(rect(136, 64, 16, 112), C.sand, 2.6),
      p(roundRect(44, 108, 28, 16, 4), C.navy, 2.2),
    ];
  }
  if (kind === "map") {
    return [
      p(roundRect(40, 48, 160, 144, 12), C.sand, 2.8),
      p("M72 88 C96 72 120 96 148 80 C168 100 176 140 140 156 C100 168 76 140 72 88 Z", C.sage, 2.6),
      p(circle(124, 112, 6), C.red, 2),
    ];
  }
  if (kind === "compass") {
    return [
      p(circle(120, 120, 84), C.cream, 3),
      p(circle(120, 120, 64), "none", 2.2),
      p(poly([[120, 56], [132, 120], [120, 184], [108, 120]]), C.red, 2.4),
      p(line(120, 40, 120, 48), "none", 2.4),
    ];
  }
  if (kind === "book") {
    return [
      p(rect(52, 52, 136, 140), C.navy, 2.8),
      p(rect(64, 64, 112, 116), C.cream, 2.4),
      p(line(120, 64, 120, 180), "none", 2.6),
    ];
  }
  if (kind === "scales-lg") {
    return [
      p(line(120, 48, 120, 196), "none", 3),
      p(line(48, 80, 192, 80), "none", 3),
      p("M48 80 L32 128 H72 Z", C.gold, 2.4),
      p("M192 80 L176 128 H208 Z", C.gold, 2.4),
      p(rect(96, 184, 48, 12), C.bronze, 2.4),
    ];
  }
  if (kind === "nuclear") {
    return [
      p(circle(120, 120, 84), C.gold, 3),
      p(circle(120, 120, 16), C.ink, 2.4),
      p("M120 52 C148 68 160 96 148 112 C120 96 92 68 120 52 Z", C.ink, 2.2),
      p("M168 148 C152 172 120 184 108 164 C132 148 156 136 168 148 Z", C.ink, 2.2),
      p("M72 148 C84 136 108 148 132 164 C120 184 88 172 72 148 Z", C.ink, 2.2),
    ];
  }
  if (kind === "helmet") {
    return [
      p("M56 140 C56 80 184 80 184 140 L168 148 C160 116 80 116 72 148 Z", C.sage, 2.8),
      p(rect(48, 136, 144, 16), C.sage, 2.4),
    ];
  }
  if (kind === "medal") {
    return [
      p(poly([[88, 40], [120, 64], [152, 40], [152, 88], [88, 88]]), C.red, 2.4),
      p(circle(120, 140, 44), C.gold, 2.8),
      p(star(120, 140, 20), C.cream, 2.2),
    ];
  }
  if (kind === "radar") {
    return [
      p(circle(120, 132, 64), "none", 2.6),
      p(circle(120, 132, 40), "none", 2.2),
      p(circle(120, 132, 16), C.sage, 2.2),
      p(line(120, 132, 176, 76), "none", 3),
      p(rect(112, 196, 16, -40), C.slate, 2.4),
    ];
  }
  if (kind === "embassy") {
    return [
      ...ground(),
      p(rect(56, 88, 128, 108), C.cream, 2.8),
      p(poly([[56, 88], [120, 48], [184, 88]]), C.navy, 2.6),
      p(rect(108, 140, 24, 56), C.navy, 2.2),
      p(rect(72, 108, 20, 16), C.blue, 2),
      p(rect(148, 108, 20, 16), C.blue, 2),
    ];
  }
  if (kind === "border") {
    return [
      p(line(120, 36, 120, 204), "none", 3.2),
      p(rect(48, 88, 56, 80), C.sand, 2.4),
      p(rect(136, 88, 56, 80), C.sage, 2.4),
      p(rect(104, 108, 32, 48), C.slate, 2.4),
    ];
  }
  if (kind === "treaty") {
    return [
      p(roundRect(52, 44, 136, 152, 8), C.cream, 2.8),
      p(line(76, 80, 164, 80), "none", 2.2),
      p(line(76, 104, 164, 104), "none", 2.2),
      p(line(76, 128, 132, 128), "none", 2.2),
      p(circle(156, 164, 18), "none", 2.6),
      p("M148 164 L156 172 L168 152", "none", 2.6),
    ];
  }
  if (kind === "megaphone") {
    return [
      p(poly([[40, 100], [108, 88], [108, 152], [40, 140]]), C.red, 2.8),
      p(poly([[108, 88], [196, 64], [196, 176], [108, 152]]), C.gold, 2.8),
      p(rect(28, 112, 16, 20), C.slate, 2.2),
    ];
  }
  if (kind === "typewriter") {
    return [
      p(roundRect(40, 96, 160, 84, 10), C.slate, 2.8),
      p(rect(60, 72, 120, 28), C.cream, 2.4),
      ...[72, 96, 120, 144, 168].map((x) => p(circle(x, 140, 6), C.cream, 1.8)),
    ];
  }
  if (kind === "antenna") {
    return [
      p(line(120, 196, 120, 48), "none", 3),
      p(line(120, 48, 64, 96), "none", 2.6),
      p(line(120, 48, 176, 96), "none", 2.6),
      p(circle(120, 44, 10), C.red, 2.4),
      p(rect(104, 180, 32, 16), C.slate, 2.4),
    ];
  }
  if (kind === "server") {
    return [
      p(roundRect(56, 44, 128, 152, 10), C.navy, 2.8),
      p(rect(72, 64, 96, 32), C.slate, 2.2),
      p(rect(72, 108, 96, 32), C.slate, 2.2),
      p(rect(72, 152, 96, 32), C.slate, 2.2),
      p(circle(88, 80, 5), C.sage, 1.6),
      p(circle(88, 124, 5), C.gold, 1.6),
      p(circle(88, 168, 5), C.red, 1.6),
    ];
  }
  if (kind === "lock-box") {
    return [
      p(roundRect(60, 100, 120, 88, 10), C.slate, 2.8),
      p("M84 100 V76 A36 36 0 0 1 156 76 V100", "none", 3),
      p(circle(120, 140, 10), C.gold, 2.2),
    ];
  }
  if (kind === "chess") {
    return [
      p(rect(72, 168, 96, 20), C.ink, 2.6),
      p(rect(96, 108, 48, 60), C.cream, 2.4),
      p(circle(120, 92, 18), C.cream, 2.4),
      p(rect(112, 68, 16, 16), C.ink, 2.2),
    ];
  }
  if (kind === "telescope") {
    return [
      p(rect(64, 100, 128, 28), C.slate, 2.8),
      p(circle(64, 114, 16), C.navy, 2.4),
      p(circle(192, 114, 12), C.cream, 2.2),
      p(line(120, 128, 120, 196), "none", 2.8),
      p(line(88, 196, 152, 196), "none", 2.8),
    ];
  }
  if (kind === "moon") {
    return [
      p(circle(120, 120, 72), C.sand, 2.8),
      p(circle(148, 100, 12), C.bronze, 2),
      p(circle(96, 140, 8), C.bronze, 2),
      p(circle(132, 148, 6), C.bronze, 1.8),
    ];
  }
  if (kind === "ai") {
    return [
      p(circle(120, 120, 36), C.navy, 2.8),
      p(circle(120, 120, 10), C.gold, 2.2),
      ...[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const x = 120 + Math.cos(a) * 64;
        const y = 120 + Math.sin(a) * 64;
        return p(circle(x, y, 10), C.cream, 2.2);
      }),
      ...[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return p(line(120 + Math.cos(a) * 36, 120 + Math.sin(a) * 36, 120 + Math.cos(a) * 54, 120 + Math.sin(a) * 54), "none", 2.2);
      }),
    ];
  }
  return [p(circle(120, 120, 64), C.cream, 2.8)];
}

function render(kind, arg) {
  if (kind === "flag") return flag(arg.colors, arg.layout);
  if (kind === "landmark") return landmark(arg);
  if (kind === "vehicle") return vehicle(arg);
  if (kind === "emblem") return emblem(arg);
  if (kind === "person") return person(arg);
  if (kind === "object") return objectIcon(arg);
  if (kind === "framed") return framed(objectIcon(arg));
  return objectIcon("map");
}

function toSvg(layers) {
  const paths = layers
    .map((layer) => {
      const sw = layer.sw ? ` stroke-width="${layer.sw}"` : "";
      return `  <path d="${layer.d}" fill="${layer.fill}"${sw}/>`;
    })
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">\n${paths}\n</svg>\n`;
}

/** @type {Array<[string, string, string, string[], string, any]>} */
const SPECS = [
  // —— 国家 / 地区 40 ——
  ["france", "法国", "country", ["法国", "France", "欧洲"], "flag", { colors: [C.navy, C.white, C.red], layout: "v3" }],
  ["ukraine", "乌克兰", "country", ["乌克兰", "Ukraine", "欧洲"], "flag", { colors: [C.blue, C.gold], layout: "h2" }],
  ["israel", "以色列", "country", ["以色列", "Israel", "中东"], "flag", { colors: [C.white, C.blue], layout: "star" }],
  ["turkey", "土耳其", "country", ["土耳其", "Turkey", "中东"], "flag", { colors: [C.red, C.white], layout: "crescent" }],
  ["south-korea", "韩国", "country", ["韩国", "Korea", "东亚"], "flag", { colors: [C.white, C.red], layout: "disc" }],
  ["north-korea", "朝鲜", "country", ["朝鲜", "North Korea", "东亚"], "flag", { colors: [C.red, C.gold], layout: "star" }],
  ["pakistan", "巴基斯坦", "country", ["巴基斯坦", "Pakistan", "南亚"], "flag", { colors: [C.sage, C.white], layout: "crescent" }],
  ["brazil", "巴西", "country", ["巴西", "Brazil", "拉美"], "flag", { colors: [C.sage, C.gold], layout: "disc" }],
  ["australia", "澳大利亚", "country", ["澳大利亚", "Australia", "澳洲"], "flag", { colors: [C.navy, C.white, C.red], layout: "canton" }],
  ["canada", "加拿大", "country", ["加拿大", "Canada", "北美"], "flag", { colors: [C.red, C.white, C.red], layout: "maple" }],
  ["italy", "意大利", "country", ["意大利", "Italy", "欧洲"], "flag", { colors: [C.sage, C.white, C.red], layout: "v3" }],
  ["spain", "西班牙", "country", ["西班牙", "Spain", "欧洲"], "flag", { colors: [C.red, C.gold, C.red], layout: "h3" }],
  ["poland", "波兰", "country", ["波兰", "Poland", "欧洲"], "flag", { colors: [C.white, C.red], layout: "h2" }],
  ["netherlands", "荷兰", "country", ["荷兰", "Netherlands", "欧洲"], "flag", { colors: [C.red, C.white, C.navy], layout: "h3" }],
  ["sweden", "瑞典", "country", ["瑞典", "Sweden", "北欧"], "flag", { colors: [C.blue, C.gold], layout: "nordic" }],
  ["switzerland", "瑞士", "country", ["瑞士", "Switzerland", "欧洲"], "flag", { colors: [C.red, C.white], layout: "cross" }],
  ["greece", "希腊", "country", ["希腊", "Greece", "欧洲"], "flag", { colors: [C.blue, C.white], layout: "cross" }],
  ["egypt", "埃及", "country", ["埃及", "Egypt", "中东", "非洲"], "flag", { colors: [C.red, C.white, C.navy], layout: "h3" }],
  ["uae", "阿联酋", "country", ["阿联酋", "UAE", "中东"], "flag", { colors: [C.sage, C.white, C.navy], layout: "h3" }],
  ["qatar", "卡塔尔", "country", ["卡塔尔", "Qatar", "中东"], "flag", { colors: [C.white, "#8A1538"], layout: "v2" }],
  ["iraq", "伊拉克", "country", ["伊拉克", "Iraq", "中东"], "flag", { colors: [C.red, C.white, C.navy], layout: "h3" }],
  ["syria", "叙利亚", "country", ["叙利亚", "Syria", "中东"], "flag", { colors: [C.red, C.white, C.navy], layout: "star" }],
  ["afghanistan", "阿富汗", "country", ["阿富汗", "Afghanistan", "中亚"], "flag", { colors: [C.navy, C.red, C.sage], layout: "v3" }],
  ["vietnam", "越南", "country", ["越南", "Vietnam", "东南亚"], "flag", { colors: [C.red, C.gold], layout: "star" }],
  ["thailand", "泰国", "country", ["泰国", "Thailand", "东南亚"], "flag", { colors: [C.red, C.white, C.navy], layout: "h3" }],
  ["indonesia", "印尼", "country", ["印尼", "Indonesia", "东南亚"], "flag", { colors: [C.red, C.white], layout: "h2" }],
  ["philippines", "菲律宾", "country", ["菲律宾", "Philippines", "东南亚"], "flag", { colors: [C.blue, C.red], layout: "sun" }],
  ["nigeria", "尼日利亚", "country", ["尼日利亚", "Nigeria", "非洲"], "flag", { colors: [C.sage, C.white, C.sage], layout: "v3" }],
  ["south-africa", "南非", "country", ["南非", "Africa", "非洲"], "flag", { colors: [C.red, C.sage, C.navy], layout: "h3" }],
  ["mexico", "墨西哥", "country", ["墨西哥", "Mexico", "拉美"], "flag", { colors: [C.sage, C.white, C.red], layout: "v3" }],
  ["argentina", "阿根廷", "country", ["阿根廷", "Argentina", "拉美"], "flag", { colors: [C.blue, C.white, C.blue], layout: "h3" }],
  ["taiwan", "台湾", "country", ["台湾", "Taiwan", "东亚"], "flag", { colors: [C.red, C.navy], layout: "canton" }],
  ["eu", "欧盟", "country", ["欧盟", "EU", "欧洲"], "emblem", "eu"],
  ["nato", "北约", "country", ["北约", "NATO", "联盟"], "emblem", "nato"],
  ["belarus", "白俄罗斯", "country", ["白俄罗斯", "Belarus", "欧洲"], "flag", { colors: [C.red, C.sage], layout: "h2" }],
  ["finland", "芬兰", "country", ["芬兰", "Finland", "北欧"], "flag", { colors: [C.white, C.navy], layout: "nordic" }],
  ["norway", "挪威", "country", ["挪威", "Norway", "北欧"], "flag", { colors: [C.red, C.navy], layout: "nordic" }],
  ["kazakhstan", "哈萨克斯坦", "country", ["哈萨克斯坦", "Kazakhstan", "中亚"], "flag", { colors: [C.blue, C.gold], layout: "sun" }],
  ["mongolia", "蒙古", "country", ["蒙古", "Mongolia", "东亚"], "flag", { colors: [C.red, C.blue, C.red], layout: "v3" }],
  ["cuba", "古巴", "country", ["古巴", "Cuba", "拉美"], "flag", { colors: [C.blue, C.red], layout: "star" }],

  // —— 历史 45 ——
  ["pyramid", "金字塔", "history", ["金字塔", "埃及", "历史"], "landmark", "pyramid"],
  ["sphinx", "狮身人面", "history", ["狮身人面", "埃及", "历史"], "landmark", "sphinx"],
  ["parthenon", "帕特农", "history", ["帕特农", "希腊", "神庙"], "landmark", "columns"],
  ["colosseum", "斗兽场", "history", ["斗兽场", "罗马", "历史"], "landmark", "colosseum"],
  ["pagoda", "宝塔", "history", ["宝塔", "佛塔", "东亚"], "landmark", "pagoda"],
  ["castle", "城堡", "history", ["城堡", "中世纪", "要塞"], "landmark", "castle"],
  ["mosque", "清真寺", "history", ["清真寺", "伊斯兰", "宗教"], "landmark", "mosque"],
  ["cathedral", "大教堂", "history", ["大教堂", "教堂", "欧洲"], "landmark", "cathedral"],
  ["great-wall", "长城", "history", ["长城", "中国", "历史"], "landmark", "wall"],
  ["eiffel", "铁塔", "history", ["铁塔", "巴黎", "地标"], "landmark", "tower"],
  ["obelisk", "方尖碑", "history", ["方尖碑", "纪念碑", "历史"], "landmark", "obelisk"],
  ["forbidden-city", "紫禁城", "history", ["紫禁城", "故宫", "中国"], "landmark", "forbidden"],
  ["statue-liberty", "自由女神", "history", ["自由女神", "美国", "地标"], "landmark", "statue"],
  ["ruins", "遗迹", "history", ["遗迹", "废墟", "考古"], "landmark", "ruins"],
  ["temple", "神庙", "history", ["神庙", "寺庙", "宗教"], "landmark", "temple"],
  ["church", "教堂", "history", ["教堂", "基督教"], "landmark", "church"],
  ["crown", "皇冠", "history", ["皇冠", "王权", "君主"], "object", "crown"],
  ["scroll", "卷轴", "history", ["卷轴", "史书", "文献"], "object", "scroll"],
  ["hourglass", "沙漏", "history", ["沙漏", "时间", "年代"], "object", "hourglass"],
  ["sword", "长剑", "history", ["长剑", "冷兵器", "战争"], "object", "sword"],
  ["shield", "盾牌", "history", ["盾牌", "防御", "纹章"], "object", "shield"],
  ["cannon", "火炮", "history", ["火炮", "大炮", "战争"], "object", "cannon"],
  ["quill", "羽毛笔", "history", ["羽毛笔", "条约", "书写"], "object", "scroll"],
  ["sundial", "日晷", "history", ["日晷", "古代", "计时"], "object", "compass"],
  ["chariot", "战车", "history", ["战车", "古代", "战争"], "vehicle", "tank"],
  ["knight", "骑士盔", "history", ["骑士", "盔甲", "中世纪"], "object", "helmet"],
  ["printing-press", "印刷术", "history", ["印刷", "古腾堡", "传播"], "object", "typewriter"],
  ["bronze-ding", "青铜鼎", "history", ["青铜", "鼎", "中国"], "object", "gold"],
  ["terracotta", "兵马俑", "history", ["兵马俑", "秦", "中国"], "person", "rifle"],
  ["silk-road", "丝绸之路", "history", ["丝路", "贸易", "历史"], "object", "map"],
  ["compass-rose", "罗盘", "history", ["罗盘", "航海", "大航海"], "object", "compass"],
  ["astrolabe", "星盘", "history", ["星盘", "天文", "航海"], "object", "compass"],
  ["viking-ship", "维京船", "history", ["维京", "长船", "航海"], "vehicle", "warship"],
  ["samurai", "武士盔", "history", ["武士", "日本", "盔甲"], "object", "helmet"],
  ["dynasty-seal", "玉玺", "history", ["玉玺", "印章", "皇权"], "emblem", "star"],
  ["greek-column", "希腊柱", "history", ["柱式", "希腊", "文明"], "landmark", "columns"],
  ["aqueduct", "引水桥", "history", ["引水桥", "罗马", "工程"], "landmark", "bridge"],
  ["hieroglyph", "象形文字", "history", ["象形文字", "埃及", "文字"], "object", "scroll"],
  ["oracle-bone", "甲骨", "history", ["甲骨文", "商朝", "中国"], "object", "scroll"],
  ["monument", "纪念碑", "history", ["纪念碑", "纪念", "历史"], "landmark", "obelisk"],
  ["throne", "王座", "history", ["王座", "皇位", "权力"], "object", "crown"],
  ["scepter", "权杖", "history", ["权杖", "王权"], "object", "sword"],
  ["amphitheater", "圆形剧场", "history", ["剧场", "罗马"], "landmark", "colosseum"],
  ["forbidden-gate", "宫门", "history", ["宫门", "皇城"], "landmark", "forbidden"],
  ["steam-engine", "蒸汽机", "history", ["蒸汽机", "工业革命"], "vehicle", "train"],

  // —— 军事 40 ——
  ["tank", "坦克", "military", ["坦克", "装甲", "陆军"], "vehicle", "tank"],
  ["submarine", "潜艇", "military", ["潜艇", "海军", "水下"], "vehicle", "submarine"],
  ["fighter", "战机", "military", ["战机", "空军", "战斗机"], "vehicle", "fighter"],
  ["carrier", "航母", "military", ["航母", "航空母舰", "海军"], "vehicle", "carrier"],
  ["helicopter", "直升机", "military", ["直升机", "武装直升机"], "vehicle", "helicopter"],
  ["drone", "无人机", "military", ["无人机", "drone", "侦察"], "vehicle", "drone"],
  ["warship", "军舰", "military", ["军舰", "驱逐舰", "海军"], "vehicle", "warship"],
  ["rocket", "火箭", "military", ["火箭", "航天", "导弹"], "vehicle", "rocket"],
  ["icbm", "洲际导弹", "military", ["洲际导弹", "ICBM", "核武"], "vehicle", "rocket"],
  ["nuclear", "核武", "military", ["核武", "原子弹", "核"], "object", "nuclear"],
  ["helmet", "钢盔", "military", ["钢盔", "头盔", "士兵"], "object", "helmet"],
  ["medal", "勋章", "military", ["勋章", "军功", "荣誉"], "object", "medal"],
  ["radar", "雷达", "military", ["雷达", "防空", "探测"], "object", "radar"],
  ["chess", "棋局", "military", ["棋局", "博弈", "战略"], "object", "chess"],
  ["artillery", "火炮阵地", "military", ["火炮", "炮兵"], "object", "cannon"],
  ["rifle", "步枪", "military", ["步枪", "枪支", "步兵"], "object", "sword"],
  ["bunker", "掩体", "military", ["掩体", "工事", "防线"], "landmark", "ruins"],
  ["fortress", "要塞", "military", ["要塞", "堡垒"], "landmark", "castle"],
  ["silo", "导弹井", "military", ["导弹井", "发射井"], "landmark", "tower"],
  ["aircraft-carrier-jet", "舰载机", "military", ["舰载机", "航母"], "vehicle", "fighter"],
  ["bomber", "轰炸机", "military", ["轰炸机", "战略空军"], "vehicle", "fighter"],
  ["destroyer", "驱逐舰", "military", ["驱逐舰", "军舰"], "vehicle", "warship"],
  ["frigate", "护卫舰", "military", ["护卫舰", "海军"], "vehicle", "warship"],
  ["battleship", "战列舰", "military", ["战列舰", "巨舰"], "vehicle", "warship"],
  ["uav", "察打一体", "military", ["察打", "无人机"], "vehicle", "drone"],
  ["hypersonic", "高超音速", "military", ["高超音速", "导弹"], "vehicle", "rocket"],
  ["missile-defense", "导弹防御", "military", ["反导", "防御"], "object", "radar"],
  ["camouflage", "迷彩", "military", ["迷彩", "隐蔽"], "object", "helmet"],
  ["dog-tag", "士兵牌", "military", ["士兵牌", "识别"], "object", "medal"],
  ["general-star", "将星", "military", ["将星", "军衔"], "emblem", "star"],
  ["army", "陆军", "military", ["陆军", "地面部队"], "vehicle", "tank"],
  ["navy", "海军", "military", ["海军", "舰队"], "vehicle", "warship"],
  ["air-force", "空军", "military", ["空军", "航空兵"], "vehicle", "fighter"],
  ["space-force", "天军", "military", ["天军", "太空作战"], "object", "satellite"],
  ["parade", "阅兵", "military", ["阅兵", "军演"], "person", "rifle"],
  ["barbed-wire", "铁丝网", "military", ["铁丝网", "边境"], "object", "border"],
  ["garrison", "驻军", "military", ["驻军", "基地"], "landmark", "castle"],
  ["war-map", "作战地图", "military", ["作战地图", "推演"], "object", "map"],
  ["alliance-star", "军事同盟", "military", ["同盟", "联盟"], "emblem", "nato"],
  ["iron-dome", "防空伞", "military", ["防空", "拦截"], "object", "radar"],

  // —— 外交 25 ——
  ["handshake", "握手", "diplomacy", ["握手", "协议", "建交"], "emblem", "handshake"],
  ["olive", "橄榄枝", "diplomacy", ["橄榄枝", "和平"], "emblem", "olive"],
  ["dove", "和平鸽", "diplomacy", ["和平鸽", "停火"], "emblem", "dove"],
  ["embassy", "大使馆", "diplomacy", ["大使馆", "外交"], "object", "embassy"],
  ["passport", "护照", "diplomacy", ["护照", "出入境"], "object", "passport"],
  ["treaty", "条约", "diplomacy", ["条约", "协定", "签署"], "object", "treaty"],
  ["border-gate", "边境口岸", "diplomacy", ["边境", "口岸", "海关"], "object", "border"],
  ["summit", "峰会", "diplomacy", ["峰会", "首脑", "会谈"], "object", "podium"],
  ["envoy", "特使", "diplomacy", ["特使", "大使"], "person", "briefcase"],
  ["visa", "签证", "diplomacy", ["签证", "入境"], "object", "passport"],
  ["roundtable", "圆桌", "diplomacy", ["圆桌", "多边"], "emblem", "olive"],
  ["veto", "否决权", "diplomacy", ["否决权", "安理会"], "object", "gavel"],
  ["resolution", "决议", "diplomacy", ["决议", "联合国"], "object", "treaty"],
  ["white-flag", "白旗", "diplomacy", ["白旗", "投降", "停火"], "person", "banner"],
  ["credentials", "国书", "diplomacy", ["国书", "递交"], "object", "scroll"],
  ["diplomatic-bag", "外交邮袋", "diplomacy", ["外交邮袋", "豁免"], "person", "briefcase"],
  ["bilateral", "双边", "diplomacy", ["双边", "两国"], "emblem", "handshake"],
  ["multilateral", "多边", "diplomacy", ["多边", "国际组织"], "emblem", "eu"],
  ["olive-treaty", "和平协议", "diplomacy", ["和平协议", "停战"], "object", "treaty"],
  ["red-phone", "热线", "diplomacy", ["热线", "危机沟通"], "object", "mic"],
  ["interpreter", "翻译", "diplomacy", ["翻译", "同传"], "person", "mic"],
  ["checkpoint", "检查站", "diplomacy", ["检查站", "关卡"], "object", "border"],
  ["asylum", "庇护", "diplomacy", ["庇护", "难民"], "object", "embassy"],
  ["extradition", "引渡", "diplomacy", ["引渡", "司法"], "object", "scales-lg"],
  ["consulate", "领事馆", "diplomacy", ["领事馆", "侨民"], "object", "embassy"],

  // —— 政治 25 ——
  ["white-house", "白宫", "politics", ["白宫", "美国政府"], "landmark", "statue"],
  ["kremlin", "克里姆林", "politics", ["克里姆林宫", "俄罗斯"], "landmark", "castle"],
  ["parliament", "议会", "politics", ["议会", "国会"], "landmark", "columns"],
  ["ballot", "投票箱", "politics", ["投票", "选举", "选票"], "object", "ballot"],
  ["podium", "演讲台", "politics", ["演讲台", "演说"], "object", "podium"],
  ["scales", "天平", "politics", ["天平", "司法", "公正"], "object", "scales-lg"],
  ["constitution", "宪法", "politics", ["宪法", "根本法"], "object", "book"],
  ["law-book", "法典", "politics", ["法典", "法律"], "object", "book"],
  ["protest", "抗议", "politics", ["抗议", "游行", "示威"], "person", "banner"],
  ["megaphone", "扩音器", "politics", ["扩音器", "动员"], "object", "megaphone"],
  ["campaign", "竞选", "politics", ["竞选", "拉票"], "object", "megaphone"],
  ["impeach", "弹劾", "politics", ["弹劾", "问责"], "object", "scales-lg"],
  ["cabinet", "内阁", "politics", ["内阁", "政府"], "object", "embassy"],
  ["monarchy", "君主制", "politics", ["君主制", "王室"], "object", "crown"],
  ["republic", "共和", "politics", ["共和", "共和制"], "emblem", "star"],
  ["federal", "联邦", "politics", ["联邦", "州"], "object", "map"],
  ["petition", "请愿", "politics", ["请愿", "联名"], "object", "scroll"],
  ["senate", "参议院", "politics", ["参议院", "上院"], "landmark", "columns"],
  ["congress", "国会大厦", "politics", ["国会大厦", "立法"], "landmark", "columns"],
  ["judge", "法官", "politics", ["法官", "法院"], "person", "gavel"],
  ["anatomy-state", "国家机器", "politics", ["国家机器", "政权"], "landmark", "forbidden"],
  ["ideology", "意识形态", "politics", ["意识形态", "主义"], "object", "book"],
  ["referendum", "公投", "politics", ["公投", "公决"], "object", "ballot"],
  ["inauguration", "就职", "politics", ["就职", "宣誓"], "object", "podium"],
  ["national-seal", "国徽", "politics", ["国徽", "纹章"], "emblem", "star"],

  // —— 经济 35 ——
  ["yuan", "人民币", "economy", ["人民币", "元", "中国货币"], "object", "yuan"],
  ["euro", "欧元", "economy", ["欧元", "Euro", "欧洲货币"], "object", "euro"],
  ["yen", "日元", "economy", ["日元", "Yen", "日本货币"], "object", "yen"],
  ["gold-bar", "金条", "economy", ["金条", "黄金", "储备"], "object", "gold"],
  ["container", "集装箱", "economy", ["集装箱", "外贸", "航运"], "object", "container"],
  ["tariff", "关税", "economy", ["关税", "贸易壁垒"], "object", "border"],
  ["inflation", "通胀", "economy", ["通胀", "物价"], "object", "yuan"],
  ["gdp", "GDP", "economy", ["GDP", "增长", "经济总量"], "object", "gold"],
  ["debt", "债务", "economy", ["债务", "国债"], "object", "scroll"],
  ["bond", "债券", "economy", ["债券", "国债"], "object", "book"],
  ["interest", "利率", "economy", ["利率", "加息", "降息"], "object", "yuan"],
  ["recession", "衰退", "economy", ["衰退", "萧条"], "object", "gold"],
  ["supply-chain", "供应链", "economy", ["供应链", "物流"], "vehicle", "truck"],
  ["wto", "世贸", "economy", ["世贸", "WTO", "贸易"], "emblem", "olive"],
  ["imf", "IMF", "economy", ["IMF", "基金组织"], "emblem", "star"],
  ["world-bank", "世界银行", "economy", ["世界银行", "贷款"], "object", "embassy"],
  ["customs", "海关", "economy", ["海关", "清关"], "object", "border"],
  ["port-crane", "港口吊机", "economy", ["港口", "吊机", "码头"], "object", "container"],
  ["bull", "牛市", "economy", ["牛市", "上涨"], "object", "gold"],
  ["bear", "熊市", "economy", ["熊市", "下跌"], "object", "gold"],
  ["subsidy", "补贴", "economy", ["补贴", "产业政策"], "object", "yuan"],
  ["sanction-stamp", "制裁章", "economy", ["制裁", "禁运"], "object", "treaty"],
  ["reserve", "外汇储备", "economy", ["外汇储备", "美元储备"], "object", "gold"],
  ["trade-war", "贸易战", "economy", ["贸易战", "加征关税"], "object", "container"],
  ["chip-ban", "芯片管制", "economy", ["芯片管制", "出口管制"], "object", "chip"],
  ["rare-earth", "稀土", "economy", ["稀土", "矿产"], "object", "gold"],
  ["lithium", "锂矿", "economy", ["锂", "电池", "矿产"], "object", "gold"],
  ["lng", "LNG", "economy", ["LNG", "液化天然气"], "object", "flame"],
  ["coal", "煤炭", "economy", ["煤炭", "煤电"], "object", "oil-drop"],
  ["gas", "天然气", "economy", ["天然气", "管道气"], "object", "flame"],
  ["offshore", "离岸", "economy", ["离岸", "避税"], "object", "lock-box"],
  ["swift", "SWIFT", "economy", ["SWIFT", "结算", "金融"], "object", "lock-box"],
  ["stock-crash", "股灾", "economy", ["股灾", "崩盘"], "object", "gold"],
  ["ipo", "上市", "economy", ["上市", "IPO"], "object", "book"],
  ["central-bank", "央行", "economy", ["央行", "货币政策"], "object", "embassy"],

  // —— 工业 / 科技 25 ——
  ["chip", "芯片", "industry", ["芯片", "半导体", "晶圆"], "object", "chip"],
  ["semiconductor", "半导体", "industry", ["半导体", "晶圆厂"], "object", "chip"],
  ["data-center", "数据中心", "industry", ["数据中心", "服务器"], "object", "server"],
  ["5g-tower", "5G基站", "industry", ["5G", "基站", "通信"], "object", "antenna"],
  ["fiber", "光缆", "industry", ["光缆", "海底光缆"], "object", "wave"],
  ["nuclear-plant", "核电站", "industry", ["核电站", "核能"], "object", "atom-plant"],
  ["solar", "光伏", "industry", ["光伏", "太阳能"], "object", "solar"],
  ["wind", "风电", "industry", ["风电", "风机"], "object", "wind"],
  ["battery", "电池", "industry", ["电池", "储能"], "object", "chip"],
  ["ev", "电动车", "industry", ["电动车", "新能源车"], "vehicle", "truck"],
  ["high-speed-rail", "高铁", "industry", ["高铁", "铁路"], "vehicle", "train"],
  ["bridge", "大桥", "industry", ["大桥", "基建"], "landmark", "bridge"],
  ["dam", "大坝", "industry", ["大坝", "水利"], "landmark", "dam"],
  ["port", "港口", "industry", ["港口", "码头"], "object", "container"],
  ["refinery", "炼厂", "industry", ["炼厂", "石化"], "object", "atom-plant"],
  ["steel", "钢铁", "industry", ["钢铁", "高炉"], "landmark", "tower"],
  ["lab", "实验室", "industry", ["实验室", "研发"], "person", "flask"],
  ["robot-arm", "机械臂", "industry", ["机械臂", "自动化"], "object", "chip"],
  ["warehouse", "仓库", "industry", ["仓库", "仓储"], "object", "container"],
  ["highway", "公路", "industry", ["公路", "交通"], "landmark", "bridge"],
  ["tunnel", "隧道", "industry", ["隧道", "基建"], "object", "strait"],
  ["space-station", "空间站", "industry", ["空间站", "航天"], "object", "satellite"],
  ["gps", "卫星导航", "industry", ["GPS", "北斗", "导航"], "object", "satellite"],
  ["encryption", "加密", "industry", ["加密", "密码"], "object", "lock-box"],
  ["ai-chip", "AI算力", "industry", ["AI", "算力", "大模型"], "object", "ai"],

  // —— 传媒 25 ——
  ["microphone", "麦克风", "media", ["麦克风", "采访", "广播"], "object", "mic"],
  ["camera", "摄像机", "media", ["摄像机", "新闻", "镜头"], "object", "camera"],
  ["television", "电视", "media", ["电视", "新闻联播"], "object", "tv"],
  ["radio", "电台", "media", ["电台", "广播"], "object", "radio"],
  ["headline", "头条", "media", ["头条", "新闻"], "object", "typewriter"],
  ["press", "新闻发布", "media", ["新闻发布会", "记者会"], "object", "podium"],
  ["journalist", "记者", "media", ["记者", "媒体"], "person", "camera"],
  ["broadcast", "直播", "media", ["直播", "播出"], "object", "antenna"],
  ["interview", "访谈", "media", ["访谈", "专访"], "person", "mic"],
  ["printing", "印刷", "media", ["印刷", "出版"], "object", "typewriter"],
  ["studio", "演播室", "media", ["演播室", "录制"], "object", "tv"],
  ["podcast", "播客", "media", ["播客", "音频"], "object", "mic"],
  ["satellite-tv", "卫星电视", "media", ["卫星电视", "转播"], "object", "satellite"],
  ["breaking", "突发", "media", ["突发新闻", "快讯"], "object", "megaphone"],
  ["editorial", "社论", "media", ["社论", "评论"], "object", "book"],
  ["photojournalism", "摄影报道", "media", ["新闻摄影"], "object", "camera"],
  ["typewriter", "打字机", "media", ["打字机", "写作"], "object", "typewriter"],
  ["antenna", "发射塔", "media", ["发射塔", "信号"], "object", "antenna"],
  ["press-pass", "记者证", "media", ["记者证", "采访证"], "object", "passport"],
  ["social", "社交传播", "media", ["社交", "舆论"], "object", "megaphone"],
  ["censor", "审查", "media", ["审查", "管控"], "emblem", "eye"],
  ["leak", "爆料", "media", ["爆料", "泄密"], "object", "lock-box"],
  ["archive", "档案", "media", ["档案", "史料"], "object", "book"],
  ["wire", "通讯社", "media", ["通讯社", "电讯"], "object", "antenna"],
  ["opinion", "舆论", "media", ["舆论", "民意"], "object", "megaphone"],

  // —— 人物 20 ——
  ["king", "国王", "people", ["国王", "君主"], "person", "crown"],
  ["emperor", "皇帝", "people", ["皇帝", "天子"], "person", "crown"],
  ["queen", "女王", "people", ["女王", "王室"], "person", "crown"],
  ["general", "将军", "people", ["将军", "指挥官"], "person", "rifle"],
  ["diplomat", "外交官", "people", ["外交官", "大使"], "person", "briefcase"],
  ["scholar", "学者", "people", ["学者", "知识分子"], "person", "scroll"],
  ["farmer", "农民", "people", ["农民", "农业"], "person", "hat"],
  ["refugee", "难民", "people", ["难民", "流离"], "person", "hat"],
  ["spy", "间谍", "people", ["间谍", "情报"], "person", "hat"],
  ["reporter", "记者人", "people", ["记者", "媒体人"], "person", "mic"],
  ["scientist", "科学家", "people", ["科学家", "研究"], "person", "flask"],
  ["engineer", "工程师", "people", ["工程师", "技术"], "person", "flask"],
  ["president", "总统", "people", ["总统", "元首"], "person", "briefcase"],
  ["minister", "部长", "people", ["部长", "大臣"], "person", "briefcase"],
  ["ambassador", "大使", "people", ["大使", "使节"], "person", "briefcase"],
  ["protester", "抗议者", "people", ["抗议者", "示威者"], "person", "banner"],
  ["judge-person", "审判者", "people", ["法官", "审判"], "person", "gavel"],
  ["monk", "僧侣", "people", ["僧侣", "宗教人士"], "person", "scroll"],
  ["knight-person", "骑士", "people", ["骑士", "武士"], "person", "rifle"],
  ["leader", "领袖", "people", ["领袖", "领导人"], "person", "banner"],

  // —— 地理 / 物体 20 ——
  ["mountain", "山脉", "objects", ["山脉", "高原", "地理"], "object", "mountain"],
  ["ocean", "海洋", "objects", ["海洋", "海权"], "object", "wave"],
  ["strait", "海峡", "objects", ["海峡", "水道", "马六甲"], "object", "strait"],
  ["canal", "运河", "objects", ["运河", "苏伊士", "巴拿马"], "object", "canal"],
  ["map", "地图", "objects", ["地图", "疆域"], "object", "map"],
  ["compass", "指南针", "objects", ["指南针", "方位"], "object", "compass"],
  ["island", "岛屿", "objects", ["岛屿", "岛链"], "object", "strait"],
  ["desert", "沙漠", "objects", ["沙漠", "干旱"], "object", "mountain"],
  ["arctic", "北极", "objects", ["北极", "北极航道"], "object", "wave"],
  ["volcano", "火山", "objects", ["火山", "喷发"], "object", "mountain"],
  ["earthquake", "地震", "objects", ["地震", "灾害"], "object", "mountain"],
  ["typhoon", "台风", "objects", ["台风", "飓风"], "object", "wave"],
  ["suez", "苏伊士", "objects", ["苏伊士", "运河"], "object", "canal"],
  ["panama", "巴拿马", "objects", ["巴拿马", "运河"], "object", "canal"],
  ["malacca", "马六甲", "objects", ["马六甲", "海峡"], "object", "strait"],
  ["himalaya", "喜马拉雅", "objects", ["喜马拉雅", "高原"], "object", "mountain"],
  ["satellite", "卫星", "objects", ["卫星", "太空"], "object", "satellite"],
  ["moon", "月球", "objects", ["月球", "登月"], "object", "moon"],
  ["telescope", "望远镜", "objects", ["望远镜", "观测"], "object", "telescope"],
  ["ai", "人工智能", "objects", ["人工智能", "AI"], "object", "ai"],
];

function folderFor(category) {
  if (category === "country") return "countries";
  return category;
}

function main() {
  const pack = [];
  const seen = new Set(EXISTING);
  for (const [id, name, category, tags, kind, arg] of SPECS) {
    if (seen.has(id)) {
      throw new Error(`Duplicate id: ${id}`);
    }
    seen.add(id);
    const layers = render(kind, arg);
    const dir = path.join(publicRoot, folderFor(category));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${id}.svg`), toSvg(layers), "utf8");
    pack.push({
      id,
      name,
      category,
      tags,
      src: `/assets/${folderFor(category)}/${id}.svg`,
      type: "svg",
    });
  }
  fs.writeFileSync(packJson, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  console.log(`Wrote ${pack.length} icons -> ${packJson}`);
}

main();
