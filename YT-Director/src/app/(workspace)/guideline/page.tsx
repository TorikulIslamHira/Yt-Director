import { ListChecks, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockScenes } from "@/lib/mock-scenes";

export default function GuidelinePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
          <ListChecks className="size-5" strokeWidth={1.75} />
          এডিটিং গাইডলাইন
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          দৃশ্য অনুযায়ী ধারাবাহিক নির্দেশনা — উপর থেকে নিচে অনুসরণ করুন।
        </p>
      </div>

      <ol className="space-y-0">
        {mockScenes.map((scene, i) => (
          <li key={scene.id}>
            <div className="flex gap-4 py-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm leading-5 font-medium text-secondary-foreground">
                {scene.index}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm leading-5 font-medium">{scene.title}</p>
                  <Badge variant={scene.status === "stock-match" ? "default" : "secondary"}>
                    {scene.status === "stock-match" ? "স্টক ম্যাচ" : "এআই প্রম্পট"}
                  </Badge>
                </div>
                <p className="text-sm leading-5 text-muted-foreground">{scene.description}</p>
                <div className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
                  <Clock className="size-3.5" strokeWidth={1.75} />
                  <span>~{scene.estimatedDurationSeconds}s</span>
                </div>
                {scene.editingNote && (
                  <p className="rounded-md bg-card px-3 py-2 text-xs leading-4 text-muted-foreground">
                    নোট: {scene.editingNote}
                  </p>
                )}
              </div>
            </div>
            {i < mockScenes.length - 1 && <Separator />}
          </li>
        ))}
      </ol>
    </main>
  );
}
