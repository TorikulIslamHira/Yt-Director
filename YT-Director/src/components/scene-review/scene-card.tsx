"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Download, ImageOff, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SceneDetailDialog } from "@/components/scene-review/scene-detail-dialog";
import { downloadProxyUrl } from "@/lib/download-blob";
import type { Scene } from "@/types/scene";

export function SceneCard({ scene }: { scene: Scene }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const isMatch = scene.status === "stock-match";
  const thumbnail = scene.stockMatches[0]?.thumbnailUrl;

  async function handleCopyPrompt() {
    if (!scene.aiPrompt) return;
    await navigator.clipboard.writeText(scene.aiPrompt);
    toast.success("প্রম্পট কপি হয়েছে");
  }

  return (
    <>
      <Card className="overflow-hidden py-0 gap-0">
        <div className="relative aspect-video w-full bg-muted">
          {thumbnail ? (
            <Image src={thumbnail} alt={scene.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff className="size-6 text-muted-foreground" strokeWidth={1.75} />
            </div>
          )}
          <Badge
            variant={isMatch ? "default" : "secondary"}
            className="absolute top-2 left-2"
          >
            {isMatch ? "স্টক ম্যাচ" : "এআই প্রম্পট"}
          </Badge>
        </div>

        <CardContent className="space-y-1.5 pt-4">
          <p className="text-sm leading-5 font-medium">
            {scene.index}. {scene.title}
          </p>
          <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {scene.description}
          </p>
          <div className="flex items-center gap-1 pt-1 text-xs leading-4 text-muted-foreground">
            <Clock className="size-3.5" strokeWidth={1.75} />
            <span>~{scene.estimatedDurationSeconds}s</span>
          </div>
        </CardContent>

        <CardFooter className="gap-2 pt-4 pb-4">
          {isMatch ? (
            <Button size="sm" className="flex-1" asChild>
              <a
                href={downloadProxyUrl(
                  scene.stockMatches[0]?.downloadUrl ?? "",
                  `scene-${scene.index}.mp4`
                )}
              >
                <Download className="size-4" strokeWidth={1.75} />
                ডাউনলোড
              </a>
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={handleCopyPrompt}>
              <Copy className="size-4" strokeWidth={1.75} />
              প্রম্পট কপি করুন
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setDetailOpen(true)}>
            বিস্তারিত
          </Button>
        </CardFooter>
      </Card>

      <SceneDetailDialog scene={scene} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
