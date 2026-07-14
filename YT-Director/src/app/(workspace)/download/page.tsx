"use client";

import { FolderDown, Video, Music, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useScenes } from "@/hooks/use-scenes";
import { mockBgmTracks } from "@/lib/mock-bgm-tracks";

export default function DownloadPage() {
  const { scenes, isDemo } = useScenes();
  const stockClips = scenes.filter((s) => s.status === "stock-match");
  const bgmTrack = mockBgmTracks[0];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
            <FolderDown className="size-5" strokeWidth={1.75} />
            ডাউনলোড সেন্টার
          </h1>
          {isDemo && <Badge variant="secondary">ডেমো ডেটা</Badge>}
        </div>
        <p className="text-sm leading-5 text-muted-foreground">
          সব ফাইল এক সাথে নিন, অথবা আলাদা আলাদা করে ডাউনলোড করুন।
        </p>
      </div>

      <Button size="lg" className="w-full sm:w-auto">
        <Download className="size-4" strokeWidth={1.75} />
        সব ডাউনলোড করুন (.zip)
      </Button>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm leading-5 font-medium">স্টক ভিডিও ক্লিপ ({stockClips.length})</p>
          {stockClips.map((scene) => (
            <div
              key={scene.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Video className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <span className="truncate text-sm leading-5">
                  {scene.index}. {scene.title}
                </span>
              </div>
              <Button size="icon-sm" variant="outline" asChild>
                <a href={scene.stockMatches[0]?.downloadUrl} download aria-label="ডাউনলোড">
                  <Download className="size-3.5" strokeWidth={1.75} />
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm leading-5 font-medium">ব্যাকগ্রাউন্ড মিউজিক</p>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Music className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="truncate text-sm leading-5">{bgmTrack.title}</span>
            </div>
            <Button size="icon-sm" variant="outline" asChild>
              <a href={bgmTrack.downloadUrl} download aria-label="ডাউনলোড">
                <Download className="size-3.5" strokeWidth={1.75} />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm leading-5 font-medium">এডিটিং গাইডলাইন ডকুমেন্ট</p>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="truncate text-sm leading-5">editing-guideline.pdf</span>
            </div>
            <Button size="icon-sm" variant="outline" asChild>
              <a href="#" download aria-label="ডাউনলোড">
                <Download className="size-3.5" strokeWidth={1.75} />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
