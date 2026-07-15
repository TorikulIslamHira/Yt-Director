"use client";

import { useEffect, useState } from "react";
import { Music, Clock3, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GenreGenerateRow } from "@/components/bgm/genre-generate-row";
import type { LoudlyGenre } from "@/lib/loudly";

export default function BgmPage() {
  const [genres, setGenres] = useState<LoudlyGenre[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bgm-genres")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "জেনার লোড করা যায়নি।");
        if (!cancelled) setGenres(data.genres);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
            <Music className="size-5" strokeWidth={1.75} />
            ব্যাকগ্রাউন্ড মিউজিক
          </h1>
          <p className="text-sm leading-5 text-muted-foreground">
            যেকোনো ধরন বেছে নিয়ে AI দিয়ে নতুন ট্র্যাক তৈরি করুন।
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm leading-5 text-error">
            <AlertCircle className="size-4 shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {!genres && !error && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {genres && (
          <div className="space-y-2">
            {genres.map((genre) => (
              <GenreGenerateRow key={genre.id} genre={genre} />
            ))}
          </div>
        )}
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
