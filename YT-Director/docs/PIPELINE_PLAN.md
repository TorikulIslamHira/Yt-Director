# yt-director — Core Pipeline Plan (Main Task 2 groundwork)

This is the data-flow contract the frontend screens are built against. Actual server-side implementation (Main Task 2: agent API routes, DB schema) comes after the frontend component build, but the shapes below are locked now so screens aren't built against guesses.

## Flow

1. **Upload** — editor pastes/uploads a script as `.doc(x)`, `.txt`, or `.pdf`. Extracted to plain text server-side.
2. **Scene segmentation (Gemini API)** — the script text is sent to Gemini, which returns a structured list of scenes. Per scene:
   - `description` — short scene summary
   - `searchKeywords` — terms used to query stock APIs
   - `estimatedDurationSeconds` — **not** real TTS audio. Computed from word count ÷ reading speed (~150 wpm English, ~120 wpm Bangla — exact constant tunable later). This number sizes how long a stock clip for that scene should be.
3. **Stock match (Pexels + Pixabay, video only)** — for each scene, search both APIs by `searchKeywords`, video results only (no photo fallback).
   - Match found → return top 3–4 video download links, closest in duration to `estimatedDurationSeconds`.
   - No match found → fall back to an **AI-prompt suggestion**: Gemini generates a text-to-video prompt for that scene, shown with a "copy prompt" action so the editor can run it through an external AI video generator. This is why the Scene Review Dashboard card needs both a "stock match" badge state and an "AI-prompt" badge state (already anticipated in the original UX plan, §1.2.4).
4. **BGM** — Loudly API generates one mood/genre-based background track for the whole video (mood derived from overall script tone by Gemini), returned as a download link.
5. **SFX (scene-transition sounds)** — **skipped for now.** No API key provided; UI should leave a clearly labeled placeholder/disabled state, not fake data. Revisit source (Pixabay Audio / Freesound / Zapsplat) later.
6. **Editing Guideline** — list-style (not timeline, per earlier decision), scene-by-scene: each entry shows the chosen stock clip or AI prompt, duration, and any generated editing note.
7. **Download Center** — bundles stock clips + BGM + guideline doc into one zip ("Download All") plus individual per-file downloads. Fetching third-party media server-side and zipping is backend work (Main Task 2) — the frontend only needs the UI for it now.

## Locked decisions (2026-07-15)

- LLM: **Gemini API** for scene segmentation, keyword extraction, duration estimate, and AI-prompt fallback generation. *(No Gemini key provided yet — needed before backend integration, not blocking frontend UI work.)*
- Voice timing: **estimate only**, no TTS audio generation.
- Stock media: **video-only**, no photo fallback; no-match scenes get an AI-generation prompt instead.
- SFX: out of scope for now — placeholder UI only.
- Third-party keys in use: Pexels, Pixabay, Loudly — stored in `YT-Director/.env.local` (gitignored, never commit).

## Open items before Main Task 2 starts

- Need a Gemini API key.
- Need to decide the actual reading-speed constants (wpm) for duration estimate — placeholders above, tune with real script samples.
- Need to pick an SFX source once ready to revisit.
