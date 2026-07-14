import { SceneCard } from "@/components/scene-review/scene-card";
import { mockScenes } from "@/lib/mock-scenes";

export default function DashboardPage() {
  const matchedCount = mockScenes.filter((s) => s.status === "stock-match").length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl leading-8 font-semibold">Scene Review Dashboard</h1>
        <p className="text-sm leading-5 text-muted-foreground">
          মোট {mockScenes.length} টা দৃশ্য — {matchedCount} টায় স্টক ম্যাচ পাওয়া গেছে,{" "}
          {mockScenes.length - matchedCount} টায় এআই প্রম্পট সাজেস্ট করা হয়েছে।
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockScenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} />
        ))}
      </div>
    </main>
  );
}
