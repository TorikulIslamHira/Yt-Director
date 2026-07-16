"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client/fetch-json";

type Template = { id: string; title: string; scriptText: string; createdAt: number };

export function TemplatesPanel({ onUse }: { onUse: (scriptText: string) => void }) {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ templates: Template[] }>("/api/templates")
      .then((data) => setTemplates(data.templates))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <p className="text-sm leading-5 text-error">{error}</p>;
  }

  if (!templates) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm leading-5 text-muted-foreground">
        এখনো কোনো টেমপ্লেট সেভ করা হয়নি — টেক্সট পেস্ট ট্যাবে স্ক্রিপ্ট লিখে/পেস্ট করে সেখান থেকে সেভ করতে পারবেন।
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex items-center justify-between gap-2 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="truncate text-sm leading-5">{t.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" onClick={() => onUse(t.scriptText)}>
                ব্যবহার করুন
              </Button>
              <Button
                size="icon-sm"
                variant="destructive"
                disabled={busyId === t.id}
                onClick={() => handleDelete(t.id)}
                aria-label="মুছে ফেলুন"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
