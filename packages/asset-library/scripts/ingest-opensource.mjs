/**
 * Normalize third-party doodle SVG packs into opensource-pack.json.
 *
 * Usage:
 *   node packages/asset-library/scripts/ingest-opensource.mjs <sourceDir> [--pack=khushmeen] [--license=CC0]
 *
 * Expects flat or nested .svg files. Writes:
 *   - public/assets/opensource/<pack>/<id>.svg
 *   - packages/asset-library/src/opensource-pack.json (merged by id)
 *
 * Recommended sources (verify license before shipping):
 *   - Khushmeen Doodle Icons (CC0)
 *   - Open Doodles / Open Peeps (CC0)
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const sourceDir = args.find((arg) => !arg.startsWith("--"));
const pack =
  args.find((arg) => arg.startsWith("--pack="))?.slice("--pack=".length) ?? "opensource";
const license =
  args.find((arg) => arg.startsWith("--license="))?.slice("--license=".length) ?? "CC0";

if (!sourceDir) {
  console.error(
    "Usage: node packages/asset-library/scripts/ingest-opensource.mjs <sourceDir> [--pack=name] [--license=CC0]",
  );
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, "../../..");
const outDir = resolve(repoRoot, "public/assets/opensource", pack);
const packPath = resolve(repoRoot, "packages/asset-library/src/opensource-pack.json");

mkdirSync(outDir, { recursive: true });

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walk(full));
    } else if (extname(name).toLowerCase() === ".svg") {
      entries.push(full);
    }
  }
  return entries;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.svg$/i, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const existing = JSON.parse(readFileSync(packPath, "utf8"));
const byId = new Map(existing.map((item) => [item.id, item]));

let added = 0;
for (const file of walk(resolve(sourceDir))) {
  const base = basename(file);
  const slug = slugify(base);
  if (!slug) {
    continue;
  }
  const id = `${pack}-${slug}`;
  const destName = `${slug}.svg`;
  const dest = join(outDir, destName);
  copyFileSync(file, dest);
  const name = slug.replace(/-/g, " ");
  byId.set(id, {
    id,
    name,
    category: "symbols",
    tags: [name, pack, "opensource"],
    aliases: [name],
    themes: ["general", "science", "product", "tutorial"],
    src: `/assets/opensource/${pack}/${destName}`,
    type: "svg",
    pack,
    license,
    source: pack,
  });
  added += 1;
}

const next = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(packPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Ingested ${added} SVGs into pack "${pack}". Catalog size: ${next.length}`);
