# AI Doodle Video

Programmatic whiteboard / doodle video engine: paste a script, get an editable `VideoProject`, preview the hand-drawn explainer, then export MP4.

The product is **not** a talking-head or digital-human tool. AI (when configured) writes a storyboard; the editor and Remotion renderer share the same JSON.

## What works

- Script → scenes → SVG draw animation, drawing hand, captions, camera move
- Create page live-previews the current copy (not a frozen demo)
- Optional LLM storyboard via OpenAI-compatible API (`LLM_API_KEY`); falls back to keyword matching
- Edge TTS locally, Azure Speech if `AZURE_SPEECH_KEY` is set; per-scene timing from real audio
- Editor: timeline, asset library (官方库 / 我的图库), text/arrow/shape tools, uploads, undo/redo, autosave
- Drawing toggles: project-level hand + default animation; per-element showHand
- Theme-gated icon matching + aliases; LLM uses a shortlist catalog
- Styles: whiteboard / blackboard / line
- Background music beds (generated on API start)
- Browser MP4 export, with cloud/CLI fallback
- Local project list + optional API project store and share links

Open-source doodle packs: drop SVGs into a folder and run:

```bash
node packages/asset-library/scripts/ingest-opensource.mjs ./path-to-svgs --pack=khushmeen --license=CC0
```

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm render:demo
pnpm render:json ./packages/asset-library/demos/demo-project.json
```

- Create: http://localhost:5173/create
- Projects: http://localhost:5173/projects
- Editor: http://localhost:5173/editor/demo

Create page includes templates (科普 / 财经 / 产品介绍 / 教程). Export MP4 offers presets for 抖音竖屏、B 站 / YouTube 横屏、方形短视频.

`pnpm dev` runs web (`:5173`) and API (`:8787`) together. Copy `.env.example` to `.env` for LLM / Azure.

Browser export needs Chrome + WebCodecs. If it fails, use **改用云端导出** (API shells out to Remotion) or `pnpm render:json`.
