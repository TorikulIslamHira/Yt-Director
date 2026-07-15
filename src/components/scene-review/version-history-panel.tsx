"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectId } from "@/hooks/use-scenes";
import { saveScenes } from "@/lib/client/scene-storage";
import { fetchJson } from "@/lib/client/fetch-json";
import type { Project, ProjectVersion } from "@/types/scene";

export function VersionHistoryPanel() {
  const projectId = useProjectId();
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [restoringIndex, setRestoringIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) {
        if (!cancelled) setVersions([]);
        return;
      }
      try {
        const data = await fetchJson<{ project: Project }>(`/api/projects/${projectId}`);
        if (!cancelled) setVersions(data.project.previousVersions);
      } catch {
        if (!cancelled) setVersions([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleRestore(index: number) {
    if (!projectId) return;
    setRestoringIndex(index);
    try {
      const { project } = await fetchJson<{ project: Project }>(
        `/api/projects/${projectId}/restore-version`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index }),
        }
      );
      saveScenes(project.scenes);
      toast.success("আগের ভার্সন পুনরুদ্ধার হয়েছে");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRestoringIndex(null);
    }
  }

  if (versions.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="flex items-center gap-2 text-sm leading-5 font-medium">
          <History className="size-4" strokeWidth={1.75} />
          পূর্ববর্তী ভার্সন
        </p>
        <div className="space-y-1.5">
          {versions.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="text-sm leading-5 text-muted-foreground">
                {v.scenes.length}টা দৃশ্য — {new Date(v.savedAt).toLocaleString()}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={restoringIndex !== null}
                onClick={() => handleRestore(i)}
              >
                {restoringIndex === i ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <RotateCcw className="size-4" strokeWidth={1.75} />
                )}
                পুনরুদ্ধার করুন
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
