"use client";

import { useState } from "react";
import { Music, Clock3 } from "lucide-react";
import { BgmTrackRow } from "@/components/bgm/bgm-track-row";
import { mockBgmTracks, BGM_MOODS } from "@/lib/mock-bgm-tracks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BgmPage() {
  const [moodFilter, setMoodFilter] = useState<(typeof BGM_MOODS)[number]>("সব");

  const filteredTracks =
    moodFilter === "সব"
      ? mockBgmTracks
      : mockBgmTracks.filter((t) => t.mood === moodFilter);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
            <Music className="size-5" strokeWidth={1.75} />
            ব্যাকগ্রাউন্ড মিউজিক
          </h1>
          <p className="text-sm leading-5 text-muted-foreground">
            আপনার স্ক্রিপ্টের ধরন অনুযায়ী তৈরি করা মিউজিক থেকে একটা বেছে নিন।
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {BGM_MOODS.map((mood) => (
            <Button
              key={mood}
              size="sm"
              variant={moodFilter === mood ? "default" : "outline"}
              className={cn("rounded-full")}
              onClick={() => setMoodFilter(mood)}
            >
              {mood}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <BgmTrackRow key={track.id} track={track} />
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 text-lg leading-7 font-semibold">
          সিন-ট্রানজিশন সাউন্ড এফেক্ট
        </h2>
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-sm leading-5 text-muted-foreground">
          <Clock3 className="size-5 shrink-0" strokeWidth={1.75} />
          <span>এই ফিচারটি এখনো যোগ করা হয়নি — শীঘ্রই আসছে।</span>
        </div>
      </div>
    </main>
  );
}
