"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Download, ImageOff, Clock, MoreVertical, ArrowUp, ArrowDown, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SceneDetailDialog } from "@/components/scene-review/scene-detail-dialog";
import { downloadProxyUrl } from "@/lib/client/download-blob";
import { mutateScenes } from "@/lib/client/scene-storage";
import type { Scene } from "@/types/scene";

export function SceneCard({
  scene,
  isFirst,
  isLast,
  isDuplicateClip,
}: {
  scene: Scene;
  isFirst: boolean;
  isLast: boolean;
  isDuplicateClip?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const isMatch = scene.status === "stock-match";
  const thumbnail = scene.stockMatches[0]?.thumbnailUrl;

  async function handleCopyPrompt() {
    if (!scene.aiPrompt) return;
    await navigator.clipboard.writeText(scene.aiPrompt);
    toast.success("প্রম্পট কপি হয়েছে");
  }

  async function handleMove(direction: "up" | "down") {
    const result = await mutateScenes((scenes) => {
      const i = scenes.findIndex((s) => s.id === scene.id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= scenes.length) return scenes;
      const next = [...scenes];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    if (result === null) toast.error("ডেমো ডেটাতে সাজানো যাবে না।");
  }

  async function handleDelete() {
    if (!confirm(`"${scene.title}" দৃশ্যটা মুছে ফেলতে চান?`)) return;
    const result = await mutateScenes((scenes) => scenes.filter((s) => s.id !== scene.id));
    if (result === null) {
      toast.error("ডেমো ডেটাতে মুছে ফেলা যাবে না।");
    } else {
      toast.success("দৃশ্যটা মুছে ফেলা হয়েছে");
    }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="outline"
                className="absolute top-2 right-2 bg-card"
                aria-label="দৃশ্য অপশন"
              >
                <MoreVertical className="size-3.5" strokeWidth={1.75} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isFirst} onSelect={() => handleMove("up")}>
                <ArrowUp className="size-4" strokeWidth={1.75} />
                উপরে সরান
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isLast} onSelect={() => handleMove("down")}>
                <ArrowDown className="size-4" strokeWidth={1.75} />
                নিচে সরান
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
                <Trash2 className="size-4" strokeWidth={1.75} />
                মুছে ফেলুন
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardContent className="space-y-1.5 pt-4">
          <div className="flex items-center gap-1.5">
            <p className="text-sm leading-5 font-medium">
              {scene.index}. {scene.title}
            </p>
            {isDuplicateClip && (
              <Badge variant="secondary" className="shrink-0 text-warning">
                <AlertTriangle className="size-3" strokeWidth={1.75} />
                ডুপ্লিকেট
              </Badge>
            )}
          </div>
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
