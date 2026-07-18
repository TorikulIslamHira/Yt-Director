import { NextRequest } from "next/server";

// The render agent (yt-direct-render-agent, in the faceless-yt-auto repo)
// runs unattended on the editor's own PC — it has no user session, so it
// authenticates with a single shared secret bearer token instead of the
// cookie-based session flow every other route uses. See docs/CONTRACT.md.
export function isAuthorizedAgent(req: NextRequest): boolean {
  const expected = process.env.RENDER_AGENT_TOKEN;
  if (!expected) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = header.slice("Bearer ".length);
  return timingSafeEqual(provided, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
