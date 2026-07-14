"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  "স্ক্রিপ্ট বিশ্লেষণ হচ্ছে",
  "দৃশ্য অনুযায়ী স্টক ফুটেজ খোঁজা হচ্ছে",
  "ব্যাকগ্রাউন্ড মিউজিক তৈরি হচ্ছে",
  "এডিটিং গাইডলাইন সাজানো হচ্ছে",
] as const;

const STEP_DURATION_MS = 1200;

export default function ProcessingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const redirect = setTimeout(() => router.push("/dashboard"), 400);
      return () => clearTimeout(redirect);
    }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), STEP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentStep, router]);

  const progress = Math.round((currentStep / STEPS.length) * 100);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-16 md:px-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl leading-8 font-semibold">প্রসেস হচ্ছে...</h1>
        <p className="text-sm leading-5 text-muted-foreground">
          এতে কিছুক্ষণ সময় লাগতে পারে, পেজ বন্ধ করবেন না।
        </p>
      </div>

      <Progress value={progress} />

      <ul className="space-y-3">
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <li key={label} className="flex items-center gap-3 text-sm leading-5">
              {done ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" strokeWidth={1.75} />
              ) : active ? (
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" strokeWidth={1.75} />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              )}
              <span className={done || active ? "" : "text-muted-foreground"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
