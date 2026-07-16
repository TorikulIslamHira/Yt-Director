import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "শুধু admin এই তথ্য দেখতে পারবে।" }, { status: 403 });
  }

  const allUsers = await db.query.users.findMany();
  const allProjects = await db
    .select({ userId: projects.userId, status: projects.status, updatedAt: projects.updatedAt })
    .from(projects);
  const allApiKeys = await db.query.userApiKeys.findMany();

  const apiKeysByUser = new Map(allApiKeys.map((row) => [row.userId, row]));

  const result = allUsers.map((u) => {
    const own = allProjects.filter((p) => p.userId === u.id);
    const completed = own.filter((p) => p.status === "completed").length;
    const lastActivityAt = own.reduce((max, p) => Math.max(max, p.updatedAt), 0);
    const keys = apiKeysByUser.get(u.id);

    return {
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin === 1,
      createdAt: u.createdAt,
      projectCount: own.length,
      completedCount: completed,
      lastActivityAt: lastActivityAt || null,
      apiKeysSet: {
        gemini: !!keys?.geminiKeyEnc,
        groq: !!keys?.groqKeyEnc,
        pexels: !!keys?.pexelsKeyEnc,
        pixabay: !!keys?.pixabayKeyEnc,
        telegram: !!keys?.telegramBotTokenEnc,
      },
    };
  });

  result.sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({ users: result });
}
