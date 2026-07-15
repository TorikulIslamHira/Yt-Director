import { NextRequest, NextResponse } from "next/server";
import { extractScriptText } from "@/lib/parse-script";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "কোনো ফাইল পাওয়া যায়নি।" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const text = await extractScriptText(file.name, buffer);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "ফাইল থেকে কোনো টেক্সট পাওয়া যায়নি।" },
        { status: 400 }
      );
    }
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "ফাইলটি পড়া যায়নি — ফাইলটি ঠিক আছে কিনা দেখুন।" },
      { status: 400 }
    );
  }
}
