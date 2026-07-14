"use client";

import { useState } from "react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BgmTrack } from "@/lib/mock-bgm-tracks";

export function BgmTrackRow({ track }: { track: BgmTrack }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
      <Button
        variant="outline"
        size="icon"
        aria-label={playing ? "থামান" : "প্লে করুন"}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? (
          <Pause className="size-4" strokeWidth={1.75} />
        ) : (
          <Play className="size-4" strokeWidth={1.75} />
        )}
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-5 font-medium">{track.title}</p>
        <p className="text-xs leading-4 text-muted-foreground">
          {Math.floor(track.durationSeconds / 60)}:{String(track.durationSeconds % 60).padStart(2, "0")}
        </p>
      </div>

      <Badge variant="secondary">{track.mood}</Badge>

      <Button size="sm" variant="outline" asChild>
        <a href={track.downloadUrl} download>
          <Download className="size-4" strokeWidth={1.75} />
          ডাউনলোড
        </a>
      </Button>
    </div>
  );
}
