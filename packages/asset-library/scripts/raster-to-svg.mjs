/**
 * Convert raster line-art (PNG) into stroke-drawable SVG.
 *
 *   1. Put files in packages/asset-library/raster/{id}.png
 *   2. pnpm --filter @ai-doodle/asset-library vectorize
 *
 * White / cream paper is dropped. Remaining ink becomes <path> with
 * fill + #171717 stroke so Remotion can draw them path-by-path.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ImageTracer from "imagetracerjs";
import { PNG } from "pngjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const rasterDir = path.join(here, "../raster");
const packPath = path.join(here, "../src/illustrated-pack.json");
const promptsPath = path.join(here, "../src/illustrated-prompts.json");
const publicRoot = path.resolve(here, "../../../public/assets");

const INK = "#171717";
const SAND = "#E4D5B7";
const PAPER = 232;

const FOLDER = {
  country: "countries",
  people: "people",
  economy: "economy",
  industry: "industry",
  objects: "objects",
  politics: "politics",
  history: "history",
  military: "military",
  media: "media",
  diplomacy: "diplomacy",
};

function loadPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function toInkBitmap(png) {
  const { width, height, data } = png;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const r = data[o] ?? 255;
    const g = data[o + 1] ?? 255;
    const b = data[o + 2] ?? 255;
    const a = data[o + 3] ?? 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const ink = a > 80 && luma < PAPER;
    out[o] = ink ? 23 : 255;
    out[o + 1] = ink ? 23 : 255;
    out[o + 2] = ink ? 23 : 255;
    out[o + 3] = 255;
  }
  return { width, height, data: out };
}

function parseRgb(fill) {
  if (!fill || fill === "none") {
    return null;
  }
  const rgb = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(fill);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
    };
  }
  const hex = fill.trim().toLowerCase();
  const short = /^#([0-9a-f]{3})$/.exec(hex);
  const long = /^#([0-9a-f]{6})$/.exec(hex);
  if (short) {
    const s = short[1] ?? "fff";
    return {
      r: Number.parseInt((s[0] ?? "f") + (s[0] ?? "f"), 16),
      g: Number.parseInt((s[1] ?? "f") + (s[1] ?? "f"), 16),
      b: Number.parseInt((s[2] ?? "f") + (s[2] ?? "f"), 16),
    };
  }
  if (long) {
    const s = long[1] ?? "ffffff";
    return {
      r: Number.parseInt(s.slice(0, 2), 16),
      g: Number.parseInt(s.slice(2, 4), 16),
      b: Number.parseInt(s.slice(4, 6), 16),
    };
  }
  return null;
}

function isPaperFill(fill) {
  const color = parseRgb(fill);
  if (!color) {
    return fill === "none" || fill === "";
  }
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b >= PAPER - 8;
}

function isDarkInk(fill) {
  const color = parseRgb(fill);
  if (!color) {
    return true;
  }
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b < 80;
}

function extractPaths(svg) {
  const paths = [];
  const re = /<path\b([^>]*)\/?>/gi;
  let match = re.exec(svg);
  while (match) {
    const attrs = match[1] ?? "";
    const d = /d="([^"]+)"/.exec(attrs)?.[1];
    const fill = /fill="([^"]+)"/.exec(attrs)?.[1] ?? INK;
    if (d && !isPaperFill(fill)) {
      paths.push({
        d,
        fill: isDarkInk(fill) ? SAND : fill,
      });
    }
    match = re.exec(svg);
  }
  return paths;
}

function readViewBox(svg, fallback) {
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1];
  if (vb) {
    return vb;
  }
  const w = /width="([^"]+)"/.exec(svg)?.[1] ?? String(fallback.width);
  const h = /height="([^"]+)"/.exec(svg)?.[1] ?? String(fallback.height);
  return `0 0 ${w} ${h}`;
}

function toStyledSvg(raw, size) {
  const paths = extractPaths(raw);
  if (paths.length === 0) {
    throw new Error("No ink paths after tracing (image may be too light)");
  }
  const viewBox = readViewBox(raw, size);
  const body = paths
    .map(
      (pathNode) =>
        `  <path d="${pathNode.d}" fill="${pathNode.fill}" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">\n${body}\n</svg>\n`;
}

function traceFile(filePath) {
  const png = loadPng(filePath);
  const imageData = toInkBitmap(png);
  const raw = ImageTracer.imagedataToSVG(imageData, {
    ltres: 1,
    qtres: 1,
    pathomit: 12,
    colorsampling: 0,
    numberofcolors: 2,
    mincolorratio: 0,
    colorquantcycles: 2,
    scale: 1,
    strokewidth: 0,
    linefilter: true,
    rightangleenhance: true,
    blurradius: 0,
    blurdelta: 20,
  });
  return toStyledSvg(raw, imageData);
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function selfTest() {
  const png = new PNG({ width: 64, height: 64 });
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const dx = x - 32;
      const dy = y - 32;
      const ink = dx * dx + dy * dy < 18 * 18;
      const o = (y * 64 + x) * 4;
      png.data[o] = ink ? 20 : 255;
      png.data[o + 1] = ink ? 20 : 255;
      png.data[o + 2] = ink ? 20 : 255;
      png.data[o + 3] = 255;
    }
  }
  const tmp = path.join(here, "../raster/_selftest.png");
  fs.mkdirSync(rasterDir, { recursive: true });
  fs.writeFileSync(tmp, PNG.sync.write(png));
  const svg = traceFile(tmp);
  fs.unlinkSync(tmp);
  if (!svg.includes("<path")) {
    throw new Error("self-test failed: no path in SVG");
  }
  console.log("raster-to-svg self-test ok");
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }
  fs.mkdirSync(rasterDir, { recursive: true });
  const prompts = loadJson(promptsPath, []);
  const promptById = new Map(prompts.map((item) => [item.id, item]));
  const files = fs
    .readdirSync(rasterDir)
    .filter((name) => name.toLowerCase().endsWith(".png"));
  if (files.length === 0) {
    console.log(`No PNG files in ${rasterDir}`);
    console.log("Drop {id}.png there, then re-run this script.");
    return;
  }

  const packById = new Map(loadJson(packPath, []).map((item) => [item.id, item]));
  for (const fileName of files) {
    const id = path.basename(fileName, path.extname(fileName));
    const meta = promptById.get(id);
    const category = meta?.category ?? "objects";
    const folder = FOLDER[category] ?? "objects";
    const svg = traceFile(path.join(rasterDir, fileName));
    const outDir = path.join(publicRoot, folder);
    fs.mkdirSync(outDir, { recursive: true });
    const rel = `/assets/${folder}/${id}.svg`;
    fs.writeFileSync(path.join(outDir, `${id}.svg`), svg, "utf8");
    packById.set(id, {
      id,
      name: meta?.name ?? id,
      category,
      tags: meta?.tags ?? [id],
      src: rel,
      type: "svg",
    });
    console.log(`traced ${fileName} -> ${rel}`);
  }
  const pack = [...packById.values()];
  fs.writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  console.log(`illustrated-pack.json now has ${pack.length} icons`);
}

main();
