"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Circle, AlertCircle, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { loadScriptText, saveScenes, loadProjectId } from "@/lib/client/scene-storage";
import { fetchJson } from "@/lib/client/fetch-json";
import type { Scene } from "@/types/scene";

const STEPS = [
  "স্ক্রিপ্ট বিশ্লেষণ হচ্ছে",
  "দৃশ্য অনুযায়ী স্টক ফুটেজ খোঁজা হচ্ছে",
  "চূড়ান্ত করা হচ্ছে",
] as const;

export default function ProcessingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const scriptText = loadScriptText();
    if (!scriptText) {
      router.replace("/");
      return;
    }

    cancelledRef.current = false;

    fetchJson<{ scenes: Scene[] }>("/api/generate-scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: scriptText }),
    })
      .then(async (data) => {
        if (cancelledRef.current) return;
        setCurrentStep(STEPS.length);
        saveScenes(data.scenes);

        const projectId = loadProjectId();
        if (projectId) {
          const scenes: Scene[] = data.scenes;
          fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenes }),
          }).catch(() => {
            // persistence is best-effort — the in-tab flow still works without it
          });
        }

        setTimeout(() => {
          if (!cancelledRef.current) router.push("/dashboard");
        }, 400);
      })
      .catch((err: Error) => {
        if (!cancelledRef.current) setError(err.message);
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [router, attempt]);

  function handleRetry() {
    setError(null);
    setCurrentStep(1);
    setAttempt((a) => a + 1);
  }

  const progress = Math.round((currentStep / STEPS.length) * 100);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16 text-center md:px-6">
        <AlertCircle className="mx-auto size-8 text-error" strokeWidth={1.75} />
        <div className="space-y-2">
          <h1 className="text-xl leading-7 font-semibold">প্রসেস করা যায়নি</h1>
          <p className="text-sm leading-5 text-muted-foreground">{error}</p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.push("/")}>
            নতুন করে শুরু করুন
          </Button>
          <Button onClick={handleRetry}>
            <RotateCcw className="size-4" strokeWidth={1.75} />
            আবার চেষ্টা করুন
          </Button>
        </div>
      </main>
    );
  }

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
          const stepNum = i + 1;
          const done = stepNum < currentStep || currentStep >= STEPS.length;
          const active = stepNum === currentStep && currentStep < STEPS.length;
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
