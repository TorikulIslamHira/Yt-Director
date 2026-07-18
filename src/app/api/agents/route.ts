import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

const ONLINE_WINDOW_MS = 60_000;

// Any registered agent is visible to any logged-in editor — this is a
// single-team internal tool, not a multi-tenant one, so agents aren't
// scoped per-user (matching how RENDER_AGENT_TOKEN itself is one shared
// secret, not per-user).
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const rows = await db.query.agents.findMany({ orderBy: desc(agents.lastHeartbeatAt) });
  const now = Date.now();

  return NextResponse.json({
    agents: rows.map((row) => ({
      id: row.id,
      name: row.name,
      gpuType: row.gpuType,
      online: now - row.lastHeartbeatAt < ONLINE_WINDOW_MS,
      lastHeartbeatAt: row.lastHeartbeatAt,
    })),
  });
}
