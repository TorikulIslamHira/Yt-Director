# Render agent contract

HTTP contract between `yt-director` (this repo) and `yt-direct-render-agent`
(lives in the `faceless-yt-auto` repo, under `render-agent/`). The agent runs
on the editor's own PC and **polls** this server — the server is never given
the agent's address, since it has no public IP (same reasoning as the deploy
runner pattern already used elsewhere).

All agent-facing endpoints require:

```
Authorization: Bearer <RENDER_AGENT_TOKEN>
```

`RENDER_AGENT_TOKEN` is a shared secret set in both this repo's `.env` and
the agent's `.env.agent` — a plain string comparison, no per-agent scoping
beyond the multi-agent identity fields below.

## Contract stability rule

Once a field exists in a job/heartbeat payload, it is never deleted,
renamed, or repurposed (changed meaning or type). New fields are always
additive. This is what lets the agent and this web app be updated and
deployed independently without breaking each other.

## Render lifecycle

A project's `renderStatus` moves: `none → pending → claimed → done | failed`.

1. **Editor uploads voiceover** — `POST /api/projects/:id/voiceover`
   (session-authenticated, multipart `voiceover` field). Sets
   `renderStatus = "pending"`.
2. **Agent polls** — `GET /api/render-agent/next-job` (bearer token).
   Claims the oldest unassigned-or-mine `pending` project
   (`renderStatus → "claimed"`) and returns:

   ```json
   {
     "job": {
       "projectId": "string",
       "title": "string",
       "scenes": [
         {
           "id": "string",
           "index": 1,
           "text": "the exact script sentence for this scene",
           "estimatedDurationSeconds": 8,
           "clipUrl": "https://..." | null
         }
       ],
       "bgm": { "genre": "string", "durationSeconds": 30 } | null,
       "voiceoverUrl": "/api/render-agent/audio/:id",
       "resultUrl": "/api/render-agent/jobs/:id/result",
       "failUrl": "/api/render-agent/jobs/:id/fail"
     }
   }
   ```

   Returns `{ "job": null }` when there is nothing to claim (or nothing
   assigned to the polling agent — see Multi-agent below). `clipUrl` is
   `scenes[].stockMatches[selectedMatchId].downloadUrl`, falling back to
   `stockMatches[0]` if the editor hasn't picked one yet, and `null` for an
   `ai-prompt` scene with no stock match at all — the agent renders a
   placeholder card for those rather than the job failing. `text` is
   `Scene.description`, which the Gemini segmentation prompt guarantees is
   the exact, unparaphrased script sentence for that scene (see
   `src/lib/integrations/gemini.ts`) — the agent sequentially matches this
   against its own whisper transcript of the voiceover to derive each
   scene's real `{startSec, endSec}` for forced alignment.
3. **Agent downloads** the voiceover (`GET` the `voiceoverUrl`, bearer
   token) and every scene's non-null `clipUrl` directly (third-party
   Pexels/Pixabay links, no auth needed).
4. **Agent processes locally**: whisper.cpp forced alignment of the
   voiceover against the known per-scene `text` → burned-in pop-up
   subtitles → per-scene clip trim/loop to its aligned duration (or a
   placeholder color card where `clipUrl` is null) → ffmpeg concat,
   narration + BGM mix, subtitle burn-in, NVENC/CPU encode.
5. **Agent reports back**:
   - Success: `POST /api/render-agent/jobs/:id/result`, multipart field
     `video` = the rendered `.mp4`. Sets `renderStatus = "done"`,
     `status = "completed"`.
   - Failure: `POST /api/render-agent/jobs/:id/fail`, multipart field
     `error` = a short human-readable string. Sets `renderStatus =
     "failed"`, `renderError` = that string. A claimed job never stays
     stuck silently — it always ends in one of these two calls.
6. **Editor downloads** the result — `GET /api/projects/:id/video`
   (session-authenticated), once `renderStatus === "done"`.

## Multi-agent

- `POST /api/render-agent/heartbeat` — every 15–30s, body
  `{ agentId, agentName, gpuType }`. Upserts the `agents` table and
  updates `lastHeartbeatAt`.
- An agent is "online" purely from recency: `(now - lastHeartbeatAt) <
  60s` — no cron job marks it offline, an absent heartbeat just ages out.
- A project can optionally be pinned to a specific `assignedAgentId`;
  `next-job` only returns jobs where that's null or equal to the polling
  agent's `agentId`.

## Known gaps (v1)

- There is no UI yet for the editor to pick which `stockMatches[]` entry
  to use per scene (`Scene.selectedMatchId` exists in the type/DB but
  nothing writes it) — the agent defaults to the first candidate.
- No automatic retry/requeue if the agent crashes mid-job — a `claimed`
  project stays that way until manually reset to `pending`.
- No BGM audio handoff yet (metadata only: genre + duration).
- Shorts generation (highlight detection, smart crop, attribution agent
  for CC-licensed clips) is a separate, later phase — see
  `faceless-yt-auto/render-agent/PLAN.md` §4.
