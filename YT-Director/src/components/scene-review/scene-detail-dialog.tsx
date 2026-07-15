"use client";

import Image from "next/image";
import { Copy, Download, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadProxyUrl } from "@/lib/download-blob";
import type { Scene } from "@/types/scene";

export function SceneDetailDialog({
  scene,
  open,
  onOpenChange,
}: {
  scene: Scene;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  async function handleCopyPrompt() {
    if (!scene.aiPrompt) return;
    await navigator.clipboard.writeText(scene.aiPrompt);
    toast.success("প্রম্পট কপি হয়েছে");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {scene.index}. {scene.title}
            </DialogTitle>
            <Badge variant={scene.status === "stock-match" ? "default" : "secondary"}>
              {scene.status === "stock-match" ? "স্টক ম্যাচ" : "এআই প্রম্পট"}
            </Badge>
          </div>
          <DialogDescription>{scene.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
          <Clock className="size-3.5" strokeWidth={1.75} />
          <span>আনুমানিক সময়: {scene.estimatedDurationSeconds}s</span>
        </div>

        {scene.status === "stock-match" ? (
          <div className="space-y-2">
            <p className="text-sm leading-5 font-medium">বিকল্প স্টক ম্যাচ</p>
            <div className="grid grid-cols-2 gap-2">
              {scene.stockMatches.map((match) => (
                <div key={match.id} className="space-y-1.5">
                  <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                    <Image
                      src={match.thumbnailUrl}
                      alt={scene.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs leading-4 text-muted-foreground capitalize">
                      {match.source} · {match.durationSeconds}s
                    </span>
                    <Button size="icon-sm" variant="outline" asChild>
                      <a
                        href={downloadProxyUrl(match.downloadUrl, `${match.source}-${match.id}.mp4`)}
                        aria-label="ডাউনলোড"
                      >
                        <Download className="size-3.5" strokeWidth={1.75} />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm leading-5 font-medium">এআই ভিডিও-জেনারেশন প্রম্পট</p>
            <p className="rounded-md border border-border bg-card p-3 text-sm leading-5 text-muted-foreground">
              {scene.aiPrompt}
            </p>
            <Button size="sm" onClick={handleCopyPrompt}>
              <Copy className="size-4" strokeWidth={1.75} />
              প্রম্পট কপি করুন
            </Button>
          </div>
        )}

        {scene.editingNote && (
          <div className="space-y-1">
            <p className="text-sm leading-5 font-medium">এডিটিং নোট</p>
            <p className="text-sm leading-5 text-muted-foreground">{scene.editingNote}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
