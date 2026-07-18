# Render agent contract

HTTP contract between `yt-director` (this repo) and `yt-direct-render-agent`
(lives in the `faceless-yt-auto` repo, under `render-agent/`). The agent runs
on the editor's own PC and **polls** this server — the server is never given
the agent's address, since it has no public IP (same reasoning as the deploy
runner pattern already used elsewhere).

All agent-facing endpoints require the header:

```
X-Agent-Key: <RENDER_AGENT_API_KEY>
```

`RENDER_AGENT_API_KEY` is a shared secret set in both this repo's `.env` and
the agent's `.env.agent` — a plain string comparison, no per-editor scoping,
matching this project's single-editor trust model.

## Render lifecycle

A project's `renderStatus` moves: `none → pending → claimed → done | failed`.

1. **Editor uploads voiceover** — `POST /api/projects/:id/voiceover`
   (session-authenticated, multipart `voiceover` field). Sets
   `renderStatus = "pending"`.
2. **Agent polls** — `GET /api/render-jobs/next` (agent key). Claims the
   oldest `pending` project (`renderStatus → "claimed"`) and returns:

   ```json
   {
     "job": {
       "projectId": "string",
       "title": "string",
       "scenes": [
         { "id": "string", "index": 1, "estimatedDurationSeconds": 8, "clipUrl": "https://..." }
       ],
       "bgm": { "genre": "string", "durationSeconds": 30 } | null,
       "voiceoverUrl": "/api/render-jobs/:id/voiceover",
       "completeUrl": "/api/render-jobs/:id/complete"
     }
   }
   ```

   Returns `{ "job": null }` when there is nothing to claim. `clipUrl` is
   `scenes[].stockMatches[selectedMatchId]`, falling back to
   `stockMatches[0]` if the editor hasn't picked one yet. If any scene has
   no stock match at all (an `ai-prompt` scene the editor hasn't filled in
   with an externally generated clip) or the voiceover file is missing
   server-side, the job is marked `failed` with `renderError` explaining why
   instead of being handed to the agent — **the agent never guesses missing
   creative input.**
3. **Agent downloads** the voiceover (`GET` the `voiceoverUrl`, same
   `X-Agent-Key` header) and every scene's `clipUrl` directly (third-party
   Pexels/Pixabay links, no auth needed).
4. **Agent processes locally**: forced alignment of the voiceover
   (whisper) → burned-in subtitles → ffmpeg concat of scene clips, narration
   + BGM mix, subtitle burn-in.
5. **Agent reports back** — `POST /api/render-jobs/:id/complete` (agent key,
   multipart):
   - Success: `video` field = the rendered `.mp4`. Sets
     `renderStatus = "done"`, `status = "completed"`.
   - Failure: `error` field = a short human-readable string. Sets
     `renderStatus = "failed"`, `renderError` = that string.
6. **Editor downloads** the result — `GET /api/projects/:id/video`
   (session-authenticated), once `renderStatus === "done"`.

## Known gap (v1)

There is no UI yet for the editor to pick which `stockMatches[]` entry to
use per scene (`Scene.selectedMatchId` exists in the type/DB but nothing
writes it) — the agent defaults to the first candidate. Wiring a "pick this
clip" action into the Scene Review Dashboard is the natural next step before
this is used for a real render, otherwise every multi-candidate scene
silently uses whichever result Pexels/Pixabay returned first.
