import { NextResponse } from "next/server";
import { fetchLoudlyGenres } from "@/lib/loudly";

export async function GET() {
  try {
    const genres = await fetchLoudlyGenres();
    return NextResponse.json({ genres });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
