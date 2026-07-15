import { NextRequest, NextResponse } from "next/server";
import { generateScenesForScript } from "@/lib/generate-scenes";
import { generateScenesSchema } from "@/lib/validation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const parsed = generateScenesSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "স্ক্রিপ্ট টেক্সট পাওয়া যায়নি বা খুব ছোট।" },
      { status: 400 }
    );
  }

  let scenes;
  try {
    scenes = await generateScenesForScript(parsed.data.text);
  } catch (err) {
    return NextResponse.json(
      { error: `স্ক্রিপ্ট বিশ্লেষণ ব্যর্থ হয়েছে: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ scenes });
}
