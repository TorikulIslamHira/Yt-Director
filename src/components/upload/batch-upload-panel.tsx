"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, XCircle, Loader2, History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/client/fetch-json";

const ACCEPTED_EXTENSIONS = [".doc", ".docx", ".txt", ".pdf"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^./\\]+$/, "");
}

type FileResult = {
  name: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
};

export function BatchUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<FileResult[] | null>(null);

  function addFiles(candidates: FileList | File[] | null) {
    if (!candidates) return;
    const accepted: File[] = [];
    for (const f of Array.from(candidates)) {
      if (isAcceptedFile(f) && f.size <= MAX_FILE_SIZE_BYTES) accepted.push(f);
    }
    setFiles((prev) => [...prev, ...accepted]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleStart() {
    if (files.length === 0) return;
    const initial: FileResult[] = files.map((f) => ({ name: f.name, status: "pending" }));
    setResults(initial);

    for (let i = 0; i < files.length; i++) {
      setResults((prev) => prev!.map((r, idx) => (idx === i ? { ...r, status: "processing" } : r)));
      try {
        const formData = new FormData();
        formData.append("file", files[i]);
        const parsed = await fetchJson<{ text: string }>("/api/parse-script", {
          method: "POST",
          body: formData,
        });
        await fetchJson<{ id: string }>("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptText: parsed.text, title: titleFromFilename(files[i].name) }),
        });
        setResults((prev) => prev!.map((r, idx) => (idx === i ? { ...r, status: "success" } : r)));
      } catch (err) {
        setResults((prev) =>
          prev!.map((r, idx) =>
            idx === i ? { ...r, status: "error", message: (err as Error).message } : r
          )
        );
      }
    }
  }

  const allDone = results !== null && results.every((r) => r.status === "success" || r.status === "error");

  return (
    <div className="space-y-4">
      {!results && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <UploadCloud className="size-6 text-muted-foreground" strokeWidth={1.75} />
            <div className="space-y-1">
              <p className="text-sm leading-5">একাধিক ফাইল টেনে আনুন অথবা ক্লিক করে বেছে নিন</p>
              <p className="text-xs leading-4 text-muted-foreground">
                .doc, .docx, .txt, .pdf — প্রতিটা সর্বোচ্চ ১০MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm leading-5"
                >
                  <span className="truncate">{f.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeFile(i)}>
                    সরান
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button size="lg" className="w-full" disabled={files.length === 0} onClick={handleStart}>
            {files.length > 0 ? `${files.length}টা প্রজেক্ট তৈরি করুন` : "প্রথমে ফাইল বেছে নিন"}
          </Button>
        </>
      )}

      {results && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm leading-5"
              >
                {r.status === "success" && (
                  <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={1.75} />
                )}
                {r.status === "error" && (
                  <XCircle className="size-4 shrink-0 text-error" strokeWidth={1.75} />
                )}
                {(r.status === "pending" || r.status === "processing") && (
                  <Loader2
                    className={`size-4 shrink-0 text-muted-foreground ${r.status === "processing" ? "animate-spin" : ""}`}
                    strokeWidth={1.75}
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                {r.message && <span className="shrink-0 text-xs text-error">{r.message}</span>}
              </div>
            ))}
          </div>

          {allDone && (
            <Button size="lg" className="w-full" asChild>
              <Link href="/history">
                <HistoryIcon className="size-4" strokeWidth={1.75} />
                হিস্টরিতে দেখুন
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
