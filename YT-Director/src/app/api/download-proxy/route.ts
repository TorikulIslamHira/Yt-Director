import { NextRequest, NextResponse } from "next/server";
import { isAllowedMediaUrl } from "@/lib/allowed-media-hosts";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") ?? "download";

  if (!url || !isAllowedMediaUrl(url)) {
    return NextResponse.json({ error: "অনুমোদিত নয় এমন URL।" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "ফাইলটি আনা যায়নি।" }, { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "ফাইলটি আনা যায়নি।" }, { status: 502 });
  }
}
