"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";
import { SceneCard } from "@/components/scene-review/scene-card";
import { VersionHistoryPanel } from "@/components/scene-review/version-history-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScenes, useProjectId } from "@/hooks/use-scenes";
import { findDuplicateClipSceneIds } from "@/lib/client/duplicate-clips";

export default function DashboardPage() {
  const router = useRouter();
  const { scenes, isDemo } = useScenes();
  const projectId = useProjectId();
  const matchedCount = scenes.filter((s) => s.status === "stock-match").length;
  const aiPromptScenes = scenes.filter((s) => s.status === "ai-prompt" && s.aiPrompt);
  const duplicateClipSceneIds = useMemo(() => findDuplicateClipSceneIds(scenes), [scenes]);

  function handleRegenerate() {
    if (
      !window.confirm(
        "আবার Generate করলে নতুন করে AI credit ব্যবহার হবে এবং বর্তমান দৃশ্যগুলো ভার্সন হিস্টরিতে সেভ হয়ে যাবে। চালিয়ে যেতে চান?"
      )
    ) {
      return;
    }
    router.push("/processing");
  }

  function handleCopyAllPrompts() {
    const text = aiPromptScenes
      .map((s, i) => `${i + 1}. ${s.title}\n${s.aiPrompt}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success(`${aiPromptScenes.length}টা AI prompt কপি হয়েছে`);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl leading-8 font-semibold">Scene Review Dashboard</h1>
            {isDemo && <Badge variant="secondary">ডেমো ডেটা</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {aiPromptScenes.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleCopyAllPrompts}>
                <Copy className="size-4" strokeWidth={1.75} />
                সব AI prompt কপি করুন
              </Button>
            )}
            {!isDemo && projectId && (
              <Button variant="outline" size="sm" onClick={handleRegenerate}>
                <RotateCcw className="size-4" strokeWidth={1.75} />
                আবার Generate করুন
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm leading-5 text-muted-foreground">
          মোট {scenes.length} টা দৃশ্য — {matchedCount} টায় স্টক ম্যাচ পাওয়া গেছে,{" "}
          {scenes.length - matchedCount} টায় এআই প্রম্পট সাজেস্ট করা হয়েছে।
        </p>
      </div>

      {duplicateClipSceneIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm leading-5 text-warning">
          <AlertTriangle className="size-4 shrink-0" strokeWidth={1.75} />
          <span>{duplicateClipSceneIds.size}টা দৃশ্যে একই স্টক ক্লিপ পুনরায় ব্যবহার হয়েছে — ক্লিপ বদলাতে দৃশ্যের বিস্তারিত থেকে অন্য একটা বেছে নিন।</span>
        </div>
      )}

      <VersionHistoryPanel />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {scenes.map((scene, i) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isFirst={i === 0}
            isLast={i === scenes.length - 1}
            isDuplicateClip={duplicateClipSceneIds.has(scene.id)}
          />
        ))}
      </div>
    </main>
  );
}
