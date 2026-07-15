"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  FolderOpen,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Plus,
  ExternalLink,
  Search,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPostedLinkDialog } from "@/components/history/add-posted-link-dialog";
import { WeeklyCompletedChart } from "@/components/history/weekly-completed-chart";
import type { Project, ProjectStatus } from "@/types/scene";
import { saveScriptText, saveScenes, saveProjectId, saveBgm } from "@/lib/client/scene-storage";
import { fetchJson } from "@/lib/client/fetch-json";

type ProjectSummary = Pick<
  Project,
  | "id"
  | "title"
  | "status"
  | "postedLinks"
  | "completedAt"
  | "generationStatus"
  | "createdAt"
  | "updatedAt"
>;

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "খসড়া",
  editing: "এডিটিং চলছে",
  completed: "সম্পন্ন",
};

const STATUS_VARIANTS: Record<ProjectStatus, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  editing: "default",
  completed: "outline",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  other: "অন্যান্য",
};

const STATUS_FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "সব" },
  { value: "draft", label: "খসড়া" },
  { value: "editing", label: "এডিটিং চলছে" },
  { value: "completed", label: "সম্পন্ন" },
];

function formatDuration(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `${Math.round(hours)} ঘণ্টা`;
  return `${(hours / 24).toFixed(1)} দিন`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [linkDialogProjectId, setLinkDialogProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  useEffect(() => {
    fetchJson<{ projects: ProjectSummary[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((err: Error) => setError(err.message));
  }, []);

  const stats = useMemo(() => {
    if (!projects) return null;
    const completed = projects.filter((p) => p.status === "completed" && p.completedAt);
    const now = new Date();
    const completedThisMonth = completed.filter((p) => {
      const d = new Date(p.completedAt!);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const avgTurnaroundMs =
      completed.length > 0
        ? completed.reduce((sum, p) => sum + (p.completedAt! - p.createdAt), 0) / completed.length
        : null;
    return {
      total: projects.length,
      completed: completed.length,
      completedThisMonth: completedThisMonth.length,
      avgTurnaroundMs,
      completedDates: completed.map((p) => p.completedAt!),
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return null;
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, search, statusFilter]);

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

  async function handleStartProcessing(id: string) {
    setBusyId(id);
    try {
      const { project } = await fetchJson<{ project: Project }>(`/api/projects/${id}`);
      saveScriptText(project.scriptText);
      saveScenes(project.scenes);
      saveProjectId(project.id);

      router.push("/processing");
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

  const linkDialogProject = projects?.find((p) => p.id === linkDialogProjectId) ?? null;

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

      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card className="py-3">
            <CardContent className="px-4">
              <p className="text-lg leading-7 font-semibold">{stats.total}</p>
              <p className="text-xs leading-4 text-muted-foreground">মোট প্রজেক্ট</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="px-4">
              <p className="text-lg leading-7 font-semibold">{stats.completed}</p>
              <p className="text-xs leading-4 text-muted-foreground">সম্পন্ন</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="px-4">
              <p className="text-lg leading-7 font-semibold">{stats.completedThisMonth}</p>
              <p className="text-xs leading-4 text-muted-foreground">এই মাসে সম্পন্ন</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="px-4">
              <p className="text-lg leading-7 font-semibold">
                {stats.avgTurnaroundMs !== null ? formatDuration(stats.avgTurnaroundMs) : "—"}
              </p>
              <p className="text-xs leading-4 text-muted-foreground">গড় সময় (তৈরি → পোস্ট)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && stats.completed > 0 && (
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm leading-5 font-medium">সাপ্তাহিক সম্পন্ন ভিডিও (গত ৮ সপ্তাহ)</p>
            <WeeklyCompletedChart completedDates={stats.completedDates} />
          </CardContent>
        </Card>
      )}

      {projects && projects.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম দিয়ে খুঁজুন..."
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <Badge
                key={f.value}
                variant={statusFilter === f.value ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

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

      {filteredProjects && filteredProjects.length === 0 && projects && projects.length > 0 && (
        <p className="text-sm leading-5 text-muted-foreground">কোনো প্রজেক্ট মিলেনি।</p>
      )}

      {filteredProjects && filteredProjects.length > 0 && (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm leading-5 font-medium">{project.title}</p>
                      <Badge variant={STATUS_VARIANTS[project.status]}>
                        {STATUS_LABELS[project.status]}
                      </Badge>
                      {project.generationStatus === "generating" && (
                        <Badge variant="secondary">
                          <Loader2 className="size-3 animate-spin" strokeWidth={1.75} />
                          প্রসেস হচ্ছে
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-4 text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {project.status === "editing" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === project.id}
                        onClick={() => setLinkDialogProjectId(project.id)}
                      >
                        <CheckCircle2 className="size-4" strokeWidth={1.75} />
                        সম্পন্ন করুন
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === project.id}
                      onClick={() => handleDelete(project.id)}
                      aria-label="মুছে ফেলুন"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} />
                    </Button>
                    {project.status === "draft" ? (
                      <Button
                        size="sm"
                        disabled={busyId === project.id || project.generationStatus === "generating"}
                        onClick={() => handleStartProcessing(project.id)}
                      >
                        <PlayCircle className="size-4" strokeWidth={1.75} />
                        প্রসেস শুরু করুন
                      </Button>
                    ) : (
                      <Button size="sm" disabled={busyId === project.id} onClick={() => handleResume(project.id)}>
                        <FolderOpen className="size-4" strokeWidth={1.75} />
                        চালিয়ে যান
                      </Button>
                    )}
                  </div>
                </div>

                {project.status === "completed" && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                    {project.postedLinks.map((link, i) => (
                      <Badge key={i} variant="outline" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {PLATFORM_LABELS[link.platform] ?? link.platform}
                          <ExternalLink className="size-3" strokeWidth={1.75} />
                        </a>
                      </Badge>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLinkDialogProjectId(project.id)}
                    >
                      <Plus className="size-3.5" strokeWidth={1.75} />
                      লিংক যোগ করুন
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {linkDialogProject && (
        <AddPostedLinkDialog
          projectId={linkDialogProject.id}
          open={linkDialogProjectId !== null}
          isFirstLink={linkDialogProject.postedLinks.length === 0}
          onOpenChange={(open) => !open && setLinkDialogProjectId(null)}
          onAdded={(updated) => {
            setProjects((prev) =>
              prev?.map((p) =>
                p.id === updated.id
                  ? { ...p, status: updated.status, postedLinks: updated.postedLinks, completedAt: updated.completedAt }
                  : p
              ) ?? null
            );
          }}
        />
      )}
    </main>
  );
}
