"use client";

import { useRef, useState } from "react";
import { Play, Pause, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LoudlyGenre } from "@/lib/loudly";

const DURATION_OPTIONS = [15, 30, 60] as const;

export function GenreGenerateRow({ genre }: { genre: LoudlyGenre }) {
  const [duration, setDuration] = useState<number>(30);
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function handleGenerate() {
    setStatus("generating");
    try {
      const res = await fetch("/api/generate-bgm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: genre.name, durationSeconds: duration }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "তৈরি করা যায়নি।");
      }
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
      setStatus("ready");
    } catch (err) {
      toast.error((err as Error).message);
      setStatus("error");
    }
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying((p) => !p);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-5 font-medium">{genre.name}</p>
        <p className="text-xs leading-4 text-muted-foreground">
          {genre.bpm.low}-{genre.bpm.high} BPM
        </p>
      </div>

      {status !== "ready" && (
        <div className="flex gap-1">
          {DURATION_OPTIONS.map((d) => (
            <Badge
              key={d}
              variant={duration === d ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setDuration(d)}
            >
              {d}s
            </Badge>
          ))}
        </div>
      )}

      {status === "ready" && audioUrl ? (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
          <Button variant="outline" size="icon" aria-label={playing ? "থামান" : "প্লে করুন"} onClick={togglePlay}>
            {playing ? <Pause className="size-4" strokeWidth={1.75} /> : <Play className="size-4" strokeWidth={1.75} />}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={audioUrl} download={`${genre.name.toLowerCase().replace(/\s+/g, "-")}.mp3`}>
              <Download className="size-4" strokeWidth={1.75} />
              ডাউনলোড
            </a>
          </Button>
        </>
      ) : (
        <Button size="sm" onClick={handleGenerate} disabled={status === "generating"}>
          {status === "generating" ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
          ) : (
            <Sparkles className="size-4" strokeWidth={1.75} />
          )}
          তৈরি করুন
        </Button>
      )}
    </div>
  );
}
