# AI Doodle Video

Programmatic whiteboard / doodle video engine. Phase 1 is a Remotion renderer that plays a fixed `VideoProject` JSON — **not** an AI video generator yet.

## Phase 1 status

Working:

- `VideoProject` schema (Zod)
- SVG path-by-path draw animation
- Drawing hand that follows the stroke
- Camera pan / zoom
- Captions + local demo audio
- Browser preview via `@remotion/player`
- `pnpm render:demo` → `output/demo.mp4`

Explicitly **mock / placeholder**:

- Audio is `public/audio/demo.wav` (placeholder tones, **not TTS**; no ffmpeg on this machine so it is WAV rather than MP3)
- Hand and country/factory artwork are demo assets
- No LLM, no cloud render, no TTS

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

Preview: `http://localhost:5173/create`

Editor: `http://localhost:5173/editor/demo`

Phase 2 editor saves to **localStorage** (not a database). Timeline can add, delete, and reorder canvases; the properties panel can change scene duration, narration, and icon draw order. Export JSON downloads the VideoProject. **导出 MP4** encodes in the browser (Chrome + WebCodecs) and downloads `<id>.mp4`. If that fails, run `pnpm render:json ./output/<id>.json`. Generate stays disabled until later phases.

Render needs a local Chrome/Chromium for Remotion.
