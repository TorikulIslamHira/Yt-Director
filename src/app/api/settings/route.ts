import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }
  const settings = await getSettings(user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }
  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const settings = await updateSettings(user.id, parsed.data);
  return NextResponse.json({ settings });
}
