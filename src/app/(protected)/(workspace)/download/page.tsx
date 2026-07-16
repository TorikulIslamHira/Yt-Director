"use client";

import { useState } from "react";
import { FolderDown, Video, Music, FileText, Captions, Clapperboard, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useScenes, useBgm, useProjectId } from "@/hooks/use-scenes";
import { buildGuidelineText } from "@/lib/build-guideline";
import { buildSrt } from "@/lib/build-captions";
import { buildFcpxml } from "@/lib/build-fcpxml";
import { downloadBlob, downloadProxyUrl } from "@/lib/client/download-blob";
import { VideoMetadataCard } from "@/components/download/video-metadata-card";

export default function DownloadPage() {
  const { scenes, isDemo } = useScenes();
  const bgm = useBgm();
  const projectId = useProjectId();
  const stockClips = scenes.filter((s) => s.status === "stock-match");
  const [isZipping, setIsZipping] = useState(false);

  async function handleDownloadAll() {
    setIsZipping(true);
    try {
      const res = await fetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes, ...(projectId ? { projectId } : {}) }),
      });
      if (!res.ok) throw new Error("zip failed");
      const blob = await res.blob();
      downloadBlob(blob, "yt-director-export.zip");

      if (projectId) {
        fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "editing" }),
        }).catch(() => {
          // best-effort — the download itself already succeeded
        });
      }
    } finally {
      setIsZipping(false);
    }
  }

  function handleDownloadGuideline() {
    const text = buildGuidelineText(scenes);
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "editing-guideline.txt");
  }

  function handleDownloadCaptions() {
    const text = buildSrt(scenes);
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "captions.srt");
  }

  function handleDownloadTimeline() {
    const text = buildFcpxml(scenes);
    downloadBlob(new Blob([text], { type: "application/xml;charset=utf-8" }), "timeline.fcpxml");
  }

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

      <Button size="lg" className="w-full sm:w-auto" onClick={handleDownloadAll} disabled={isZipping}>
        {isZipping ? (
          <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <Download className="size-4" strokeWidth={1.75} />
        )}
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
                <a
                  href={downloadProxyUrl(scene.stockMatches[0]?.downloadUrl ?? "", `scene-${scene.index}.mp4`)}
                  aria-label="ডাউনলোড"
                >
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
              <span className="truncate text-sm leading-5 text-muted-foreground">
                {bgm ? `${bgm.genre} — ${bgm.durationSeconds}s (সব ডাউনলোডে অন্তর্ভুক্ত)` : "BGM & SFX পেজে গিয়ে একটা ট্র্যাক তৈরি করুন"}
              </span>
            </div>
            {bgm && projectId ? (
              <Button size="icon-sm" variant="outline" asChild>
                <a href={`/api/projects/${projectId}/bgm`} aria-label="ডাউনলোড">
                  <Download className="size-3.5" strokeWidth={1.75} />
                </a>
              </Button>
            ) : (
              <Button size="icon-sm" variant="outline" disabled title="আগে BGM & SFX পেজে গিয়ে একটা ট্র্যাক তৈরি করুন">
                <Download className="size-3.5" strokeWidth={1.75} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <VideoMetadataCard />

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm leading-5 font-medium">এডিটিং গাইডলাইন ডকুমেন্ট</p>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="truncate text-sm leading-5">editing-guideline.txt</span>
            </div>
            <Button size="icon-sm" variant="outline" onClick={handleDownloadGuideline} aria-label="ডাউনলোড">
              <Download className="size-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm leading-5 font-medium">ক্যাপশন ফাইল (আনুমানিক সময়)</p>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Captions className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="truncate text-sm leading-5">captions.srt</span>
            </div>
            <Button size="icon-sm" variant="outline" onClick={handleDownloadCaptions} aria-label="ডাউনলোড">
              <Download className="size-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm leading-5 font-medium">টাইমলাইন (Premiere/DaVinci Resolve-এ import করুন)</p>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Clapperboard className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="truncate text-sm leading-5">timeline.fcpxml</span>
            </div>
            <Button size="icon-sm" variant="outline" onClick={handleDownloadTimeline} aria-label="ডাউনলোড">
              <Download className="size-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
