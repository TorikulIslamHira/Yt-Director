<p align="center">
  <!-- আপনার লোগোর লিংক নিচের src এর ভেতরে দিন -->
  <img src="https://via.placeholder.com/200x200.png?text=YT-Direct+Logo" width="200" alt="YT-Direct Logo">
</p>

<h1 align="center">YT-Direct</h1>

<p align="center">
  <strong>Upload a script, get back production-ready material.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

<p align="center">
  <!-- আপনার ডেমো বা স্ক্রিনশটের লিংক নিচের src এর ভেতরে দিন -->
  <!-- <img src="screenshot-link.png" alt="YT-Direct Screenshot" width="800"> -->
</p>

<br>

`yt-direct` is an internal production tool built for a Bangla-language "what if?" (speculative/historical) YouTube channel. It automates the heavy lifting of video pre-production — but final creative decisions always stay with the editor. The system **never** generates AI video itself.

---

## 📌 Table of Contents
- [🎯 What it does](#-what-it-does)
- [🧠 Architecture — at a glance](#-architecture--at-a-glance)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Related repositories](#-related-repositories)
- [🚀 Running locally](#-running-locally)
- [🗂️ Project status](#️-project-status)
- [🧭 Design principles](#-design-principles)

---

## 🎯 What it does

*   **Script parsing** — breaks a raw script down into scenes.
*   **Stock footage matching** — searches Pexels + Pixabay and returns direct download links (completely free).
*   **AI video prompts** — when no stock match is found, writes a platform-agnostic prompt (usable on Kling, Veo, Runway, Sora, or any other tool). The system never generates video itself — the editor takes the prompt to whichever platform they prefer.
*   **BGM & sound effects** — mood-matched music and SFX suggestions with download links (Pixabay Music + Freesound).
*   **Editing guideline** — scene-by-scene director's notes: cut type, pacing, caption timing, music sync points.
*   **Final render** — once a voiceover is uploaded, a render agent running on the editor's own PC (separate repo) does forced alignment + ffmpeg assembly to produce the final cut.

## 🧠 Architecture — at a glance

Video rendering is intentionally **pull-based** — the website queues a render job, an agent running on the editor's own PC polls and claims it, processes it locally, and uploads the result back. This mirrors the same pattern already used for deploys (a self-hosted runner polling the server, since the server has no public IP) — there's no cloud rendering API cost involved.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16.2.10 (LTS) · React 19.2 · Node 22 LTS |
| **LLM** | Google AI Studio (Gemini API) — `gemini-3.5-flash` (direction) · `gemini-3.1-flash-lite` (parsing) |
| **TTS** | ElevenLabs (Flash/Turbo models) |
| **Stock footage** | Pexels API · Pixabay API (free) |
| **BGM/SFX** | Pixabay Music API · Freesound API (free) |
| **Storage** | Cloudflare R2 |
| **Final rendering** | `yt-direct-render-agent` — whisper.cpp + ffmpeg (GPU), separate repo |

*Built cost-first — stock is always searched before falling back to an AI-gen prompt (no generation calls happen inside the system), and rendering runs on self-hosted GPU hardware — monthly system cost is essentially limited to LLM tokens and TTS credits.*

## 📦 Related repositories

*   **yt-direct-render-agent** — the final video assembly agent. Lives in the `faceless-yt-auto` repo under `render-agent/` (built by adapting that repo's existing whisper + ffmpeg pipeline into a pull-based poller), connected to this repo only via HTTP API. Endpoints and payload contract are documented in `docs/CONTRACT.md` in both repos.

## 🚀 Running locally

Required in `.env`: Pexels API, Pixabay API, Gemini API, ElevenLabs API, Cloudflare R2 credentials.

```bash
npm install
npm run dev
```

*To use the final-render feature, set up `yt-direct-render-agent` separately (on your own GPU PC) — see that repo's `SETUP.md`.*

## 🗂️ Project status

*   ✅ Pipeline architecture designed
*   ✅ Tech stack locked
*   ✅ Design guide and UX guidelines planned
*   🚧 Frontend components — in progress
*   ✅ Render-agent handoff routes — `/api/projects/:id/voiceover`, `/api/render-agent/*`, `/api/projects/:id/video` (see `docs/CONTRACT.md`)
*   ✅ `yt-direct-render-agent` — built in `faceless-yt-auto/render-agent/`, deploy is a manual step on the editor's own PC (see that repo's `render-agent/SETUP.md`)
*   ⏳ Scene Review UI: no "pick this stock clip" action yet — agent defaults to the first candidate per scene (see `docs/CONTRACT.md` known gap)

## 🧭 Design principles

*   **Editor-in-the-loop** — the system handles discovery and structuring; creative judgment always stays human.
*   **Stock-first, AI-last** — the core cost-minimization strategy.
*   **Platform-agnostic prompts** — no vendor lock-in.
*   **Minimal UI** — optimized for reviewing multiple videos a day quickly, not for decoration.
