import { NextResponse } from "next/server";
import { fetchLoudlyGenres } from "@/lib/integrations/loudly";

export const revalidate = 3600;

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
