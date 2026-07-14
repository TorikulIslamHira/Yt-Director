"use client";

import { SceneCard } from "@/components/scene-review/scene-card";
import { Badge } from "@/components/ui/badge";
import { useScenes } from "@/hooks/use-scenes";

export default function DashboardPage() {
  const { scenes, isDemo } = useScenes();
  const matchedCount = scenes.filter((s) => s.status === "stock-match").length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl leading-8 font-semibold">Scene Review Dashboard</h1>
          {isDemo && <Badge variant="secondary">ডেমো ডেটা</Badge>}
        </div>
        <p className="text-sm leading-5 text-muted-foreground">
          মোট {scenes.length} টা দৃশ্য — {matchedCount} টায় স্টক ম্যাচ পাওয়া গেছে,{" "}
          {scenes.length - matchedCount} টায় এআই প্রম্পট সাজেস্ট করা হয়েছে।
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} />
        ))}
      </div>
    </main>
  );
}
