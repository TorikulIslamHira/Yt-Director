yt-direct
Upload a script, get back production-ready material — matched stock footage, AI video prompts, BGM/SFX suggestions, and a full editing guideline, all in one place.
yt-direct is an internal production tool built for a Bangla-language "what if?" (speculative/historical) YouTube channel. It automates the heavy lifting of video pre-production — but final creative decisions always stay with the editor. The system never generates AI video itself.
🎯 What it does
Script parsing — breaks a raw script down into scenes
Stock footage matching — searches Pexels + Pixabay and returns direct download links (completely free)
AI video prompts — when no stock match is found, writes a platform-agnostic prompt (usable on Kling, Veo, Runway, Sora, or any other tool). The system never generates video itself — the editor takes the prompt to whichever platform they prefer.
BGM & sound effects — mood-matched music and SFX suggestions with download links (Pixabay Music + Freesound)
Editing guideline — scene-by-scene director's notes: cut type, pacing, caption timing, music sync points
Final render — once a voiceover is uploaded, a render agent running on the editor's own PC (separate repo) does forced alignment + ffmpeg assembly to produce the final cut
🧠 Architecture — at a glance
Code
Video rendering is intentionally pull-based — the website queues a render job, an agent running on the editor's own PC polls and claims it, processes it locally, and uploads the result back. This mirrors the same pattern already used for deploys (a self-hosted runner polling the server, since the server has no public IP) — there's no cloud rendering API cost involved.
🛠️ Tech Stack
Layer
Technology
Frontend
Next.js 16.2.10 (LTS) · React 19.2 · Node 22 LTS
LLM
Google AI Studio (Gemini API) — gemini-3.5-flash (direction) · gemini-3.1-flash-lite (parsing)
TTS
ElevenLabs (Flash/Turbo models)
Stock footage
Pexels API · Pixabay API (free)
BGM/SFX
Pixabay Music API · Freesound API (free)
Storage
Cloudflare R2
Final rendering
yt-direct-render-agent — whisper.cpp + ffmpeg (GPU), separate repo
Built cost-first — stock is always searched before falling back to an AI-gen prompt (no generation calls happen inside the system), and rendering runs on self-hosted GPU hardware — monthly system cost is essentially limited to LLM tokens and TTS credits.
📦 Related repositories
yt-direct-render-agent — the final video assembly agent, fully independent from this repo, connected only via HTTP API. Endpoints and payload contract are documented in CONTRACT.md in both repos.
🚀 Running locally
Bash
Required in .env:
Code
To use the final-render feature, set up yt-direct-render-agent separately (on your own GPU PC) — see that repo's SETUP.md.
🗂️ Project status
✅ Pipeline architecture designed
✅ Tech stack locked
✅ Design guide and UX guidelines planned
🚧 Frontend components — in progress
🚧 Backend agent routes — in progress
⏳ Render agent repo setup — planned, build pending
🧭 Design principles
Editor-in-the-loop — the system handles discovery and structuring; creative judgment always stays human
Stock-first, AI-last — the core cost-minimization strategy
Platform-agnostic prompts — no vendor lock-in
Minimal UI — optimized for reviewing multiple videos a day quickly, not for decoration
