"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/client/fetch-json";
import { saveScriptText, saveScenes, saveProjectId, saveBgm } from "@/lib/client/scene-storage";
import { useProjectId } from "@/hooks/use-scenes";
import type { Project, ProjectStatus } from "@/types/scene";

type ProjectSummary = Pick<Project, "id" | "title" | "status" | "generationStatus" | "updatedAt">;

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "খসড়া",
  editing: "এডিটিং চলছে",
  completed: "সম্পন্ন",
};

export function ActiveProjectsPanel() {
  const currentProjectId = useProjectId();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ projects: ProjectSummary[] }>("/api/projects")
      .then((data) => setProjects(data.projects.filter((p) => p.status !== "completed")))
      .catch(() => setProjects([]));
  }, []);

  async function handleSwitch(id: string) {
    if (id === currentProjectId || switchingId) return;
    setSwitchingId(id);
    try {
      const { project } = await fetchJson<{ project: Project }>(`/api/projects/${id}`);
      saveScriptText(project.scriptText);
      saveScenes(project.scenes);
      saveProjectId(project.id);
      if (project.bgm) saveBgm(project.bgm);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSwitchingId(null);
    }
  }

  if (!projects || projects.length <= 1) return null;

  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="flex items-center gap-2 text-sm leading-5 font-medium">
          <FolderKanban className="size-4" strokeWidth={1.75} />
          একসাথে চলমান প্রজেক্ট ({projects.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSwitch(p.id)}
              disabled={switchingId !== null}
              className="flex max-w-56 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-left text-xs leading-4 transition-colors enabled:hover:bg-muted disabled:opacity-60 aria-[current=true]:border-primary"
              aria-current={p.id === currentProjectId}
            >
              {switchingId === p.id && (
                <Loader2 className="size-3 shrink-0 animate-spin" strokeWidth={1.75} />
              )}
              <span className="truncate">{p.title}</span>
              <Badge
                variant={p.generationStatus === "generating" ? "secondary" : "outline"}
                className="shrink-0"
              >
                {p.generationStatus === "generating" ? "প্রসেস হচ্ছে" : STATUS_LABELS[p.status]}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
