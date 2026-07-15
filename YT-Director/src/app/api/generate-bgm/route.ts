import { NextRequest, NextResponse } from "next/server";
import { generateLoudlyTrack } from "@/lib/loudly";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const genre: string | undefined = body?.genre;
  const durationSeconds: number = body?.durationSeconds ?? 30;

  if (!genre) {
    return NextResponse.json({ error: "genre প্রয়োজন।" }, { status: 400 });
  }

  let musicFilePath: string;
  try {
    const result = await generateLoudlyTrack(genre, durationSeconds);
    musicFilePath = result.musicFilePath;
  } catch (err) {
    const message = (err as Error).message;
    const isCredits = /credit/i.test(message);
    return NextResponse.json({ error: message }, { status: isCredits ? 402 : 502 });
  }

  const audioRes = await fetch(musicFilePath);
  if (!audioRes.ok || !audioRes.body) {
    return NextResponse.json(
      { error: "তৈরি হওয়া অডিও ফাইল আনা যায়নি।" },
      { status: 502 }
    );
  }

  return new Response(audioRes.body, {
    headers: {
      "Content-Type": audioRes.headers.get("content-type") ?? "audio/mpeg",
      "Content-Disposition": `attachment; filename="${genre.toLowerCase().replace(/\s+/g, "-")}.mp3"`,
    },
  });
}
