import { NextRequest, NextResponse } from "next/server";
import { parseUrlSchema } from "@/lib/validation";
import { assertPublicHttpUrl } from "@/lib/ssrf-guard";
import { extractTextFromHtml } from "@/lib/extract-url-text";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }

  const parsed = parseUrlSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertPublicHttpUrl(parsed.data.url);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  try {
    const res = await fetch(safeUrl, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; yt-director/1.0)" },
    });
    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json(
        { error: "এই লিংক রিডাইরেক্ট করছে — সরাসরি লিংক দিন।" },
        { status: 400 }
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: "লিংক থেকে পেজ আনা যায়নি।" }, { status: 502 });
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "এই লিংকে কোনো ওয়েবপেজ পাওয়া যায়নি।" }, { status: 400 });
    }

    const html = await res.text();
    const text = extractTextFromHtml(html);
    if (!text.trim()) {
      return NextResponse.json({ error: "পেজ থেকে কোনো টেক্সট পাওয়া যায়নি।" }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "লিংক থেকে পেজ আনা যায়নি।" }, { status: 502 });
  }
}
