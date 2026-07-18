import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { isAuthorizedAgent } from "@/lib/auth/agent";

const ONLINE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  if (!isAuthorizedAgent(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : "";
  const agentName = typeof body?.agentName === "string" ? body.agentName.trim() : "";
  const gpuType = typeof body?.gpuType === "string" ? body.gpuType.trim() : "cpu";

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  const now = Date.now();
  const existing = await db.query.agents.findFirst({ where: eq(agents.id, agentId) });

  if (existing) {
    await db
      .update(agents)
      .set({ name: agentName || existing.name, gpuType, lastHeartbeatAt: now })
      .where(eq(agents.id, agentId));
  } else {
    await db.insert(agents).values({
      id: agentId,
      name: agentName || agentId,
      gpuType,
      lastHeartbeatAt: now,
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true, onlineWindowMs: ONLINE_WINDOW_MS });
}
