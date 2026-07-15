"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History, FolderOpen, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/types/scene";
import { saveScriptText, saveScenes, saveProjectId, saveBgm } from "@/lib/scene-storage";
import { fetchJson } from "@/lib/fetch-json";

type ProjectSummary = Pick<Project, "id" | "title" | "createdAt" | "updatedAt">;

export default function HistoryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ projects: ProjectSummary[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleResume(id: string) {
    setBusyId(id);
    try {
      const { project } = await fetchJson<{ project: Project }>(`/api/projects/${id}`);
      saveScriptText(project.scriptText);
      saveScenes(project.scenes);
      saveProjectId(project.id);
      if (project.bgm) saveBgm(project.bgm);

      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
          <History className="size-5" strokeWidth={1.75} />
          প্রজেক্ট হিস্টরি
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          আগের স্ক্রিপ্টগুলোতে ফিরে যান অথবা মুছে ফেলুন।
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm leading-5 text-error">
          <AlertCircle className="size-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {!projects && !error && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {projects && projects.length === 0 && (
        <p className="text-sm leading-5 text-muted-foreground">এখনো কোনো প্রজেক্ট সেভ হয়নি।</p>
      )}

      {projects && projects.length > 0 && (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm leading-5 font-medium">{project.title}</p>
                  <p className="text-xs leading-4 text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === project.id}
                    onClick={() => handleDelete(project.id)}
                    aria-label="মুছে ফেলুন"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </Button>
                  <Button size="sm" disabled={busyId === project.id} onClick={() => handleResume(project.id)}>
                    <FolderOpen className="size-4" strokeWidth={1.75} />
                    চালিয়ে যান
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
