import { NextRequest, NextResponse } from "next/server";
import { generateVideoMetadata } from "@/lib/integrations/gemini";
import { generateMetadataSchema } from "@/lib/validation";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const parsed = generateMetadataSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "স্ক্রিপ্ট টেক্সট পাওয়া যায়নি বা খুব ছোট।" },
      { status: 400 }
    );
  }

  try {
    const metadata = await generateVideoMetadata(parsed.data.scriptText);
    return NextResponse.json({ metadata });
  } catch (err) {
    return NextResponse.json(
      { error: `মেটাডেটা তৈরি ব্যর্থ হয়েছে: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
