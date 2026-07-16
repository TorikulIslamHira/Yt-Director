"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BgmInfo, Scene } from "@/types/scene";

const PLACEHOLDER_TICK_MS = 100;

export function RoughCutPreview({
  scenes,
  bgm,
  projectId,
}: {
  scenes: Scene[];
  bgm: BgmInfo | null;
  projectId: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const placeholderTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scene = scenes[index];
  const isStockMatch = scene?.status === "stock-match" && scene.stockMatches[0];

  // Advances to the next scene, or stops at the end.
  function handleEnded() {
    setProgress(0);
    if (index < scenes.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setIsPlaying(false);
      setIndex(0);
    }
  }

  function togglePlay() {
    setIsPlaying((p) => !p);
  }

  function skip(direction: 1 | -1) {
    const next = index + direction;
    if (next < 0 || next >= scenes.length) return;
    setProgress(0);
    setIndex(next);
  }

  // Drives the placeholder timer for ai-prompt scenes (no real clip to attach onEnded/onTimeUpdate to).
  useEffect(() => {
    if (placeholderTimer.current) clearInterval(placeholderTimer.current);
    if (!isPlaying || isStockMatch || !scene) return;

    const totalMs = scene.estimatedDurationSeconds * 1000;
    let elapsed = 0;
    placeholderTimer.current = setInterval(() => {
      elapsed += PLACEHOLDER_TICK_MS;
      setProgress(Math.min(100, (elapsed / totalMs) * 100));
      if (elapsed >= totalMs) {
        clearInterval(placeholderTimer.current!);
        handleEnded();
      }
    }, PLACEHOLDER_TICK_MS);

    return () => {
      if (placeholderTimer.current) clearInterval(placeholderTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, index]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying && isStockMatch) {
      video.play().catch(() => {
        // autoplay can be blocked before a user gesture — the play button click itself is the gesture, so this is rare
      });
    } else {
      video.pause();
    }
  }, [isPlaying, index, isStockMatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  if (scenes.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm leading-5 font-medium">
            <Clapperboard className="size-4" strokeWidth={1.75} />
            রাফ-কাট প্রিভিউ
          </p>
          <span className="text-xs leading-4 text-muted-foreground">
            দৃশ্য {index + 1}/{scenes.length}
          </span>
        </div>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-black">
          {isStockMatch ? (
            <video
              key={scene.id}
              ref={videoRef}
              src={scene.stockMatches[0].downloadUrl}
              className="h-full w-full object-contain"
              muted
              playsInline
              onEnded={handleEnded}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress((v.currentTime / v.duration) * 100);
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 text-center text-white/80">
              <p className="text-sm leading-5 font-medium">{scene.title}</p>
              <p className="line-clamp-3 text-xs leading-4 text-white/60">{scene.description}</p>
              <p className="text-xs leading-4 text-white/40">(এআই প্রম্পট — নমুনা ক্লিপ নেই)</p>
            </div>
          )}
        </div>

        <Progress value={progress} />

        <div className="flex items-center justify-center gap-2">
          <Button size="icon" variant="outline" onClick={() => skip(-1)} disabled={index === 0}>
            <SkipBack className="size-4" strokeWidth={1.75} />
          </Button>
          <Button size="icon" onClick={togglePlay}>
            {isPlaying ? (
              <Pause className="size-4" strokeWidth={1.75} />
            ) : (
              <Play className="size-4" strokeWidth={1.75} />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => skip(1)}
            disabled={index === scenes.length - 1}
          >
            <SkipForward className="size-4" strokeWidth={1.75} />
          </Button>
        </div>

        <p className="text-center text-xs leading-4 text-muted-foreground">
          স্টক ক্লিপ নিঃশব্দে চলে — শুধু দৃশ্যের ক্রম দেখানোর জন্য{bgm && projectId ? ", BGM সহ" : ""}।
        </p>

        {bgm && projectId && (
          <audio ref={audioRef} src={`/api/projects/${projectId}/bgm`} loop />
        )}
      </CardContent>
    </Card>
  );
}
