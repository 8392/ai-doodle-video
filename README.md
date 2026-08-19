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
- No LLM, no editor, no API

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm render:demo
```

Preview: `http://localhost:5173/create`

Editor: `http://localhost:5173/editor/demo`

Phase 2 editor saves to **localStorage** (not a database). Export JSON downloads the VideoProject. MP4 is still `pnpm render:demo`. Generate is disabled until Phase 3.

Render needs a local Chrome/Chromium for Remotion.
