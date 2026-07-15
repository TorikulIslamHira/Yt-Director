"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Download, Clock, Check, Loader2, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { downloadProxyUrl } from "@/lib/client/download-blob";
import { mutateScenes } from "@/lib/client/scene-storage";
import type { Scene, StockMatch } from "@/types/scene";

export function SceneDetailDialog({
  scene,
  open,
  onOpenChange,
}: {
  scene: Scene;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [note, setNote] = useState(scene.editingNote);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingClip, setIsSelectingClip] = useState<string | null>(null);

  async function handleCopyPrompt() {
    if (!scene.aiPrompt) return;
    await navigator.clipboard.writeText(scene.aiPrompt);
    toast.success("প্রম্পট কপি হয়েছে");
  }

  async function handleSaveNote() {
    setIsSaving(true);
    try {
      const result = await mutateScenes((scenes) =>
        scenes.map((s) => (s.id === scene.id ? { ...s, editingNote: note } : s))
      );
      if (result === null) {
        toast.error("ডেমো ডেটাতে নোট সেভ করা যাবে না।");
      } else {
        toast.success("নোট সেভ হয়েছে");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSelectClip(match: StockMatch) {
    setIsSelectingClip(match.id);
    try {
      const result = await mutateScenes((scenes) =>
        scenes.map((s) =>
          s.id === scene.id
            ? { ...s, stockMatches: [match, ...s.stockMatches.filter((m) => m.id !== match.id)] }
            : s
        )
      );
      if (result === null) {
        toast.error("ডেমো ডেটাতে ক্লিপ বেছে নেওয়া যাবে না।");
      } else {
        toast.success("এই ক্লিপটা এখন প্রধান ক্লিপ হিসেবে সেট হয়েছে");
      }
    } finally {
      setIsSelectingClip(null);
    }
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
              {scene.stockMatches.map((match, i) => (
                <div key={match.id} className="space-y-1.5">
                  <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                    <Image
                      src={match.thumbnailUrl}
                      alt={scene.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {i === 0 && (
                      <Badge className="absolute top-1.5 left-1.5">
                        <Check className="size-3" strokeWidth={1.75} />
                        নির্বাচিত
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs leading-4 text-muted-foreground capitalize">
                      {match.source} · {match.durationSeconds}s
                    </span>
                    <div className="flex items-center gap-1">
                      {i !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSelectingClip !== null}
                          onClick={() => handleSelectClip(match)}
                        >
                          {isSelectingClip === match.id ? (
                            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                          ) : (
                            "বেছে নিন"
                          )}
                        </Button>
                      )}
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

        <div className="space-y-1.5">
          <p className="text-sm leading-5 font-medium">এডিটিং নোট</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="এই দৃশ্যের জন্য একটা এডিটিং নোট লিখুন..."
            className="min-h-20 resize-y"
          />
          <Button size="sm" variant="outline" disabled={isSaving} onClick={handleSaveNote}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Save className="size-4" strokeWidth={1.75} />
            )}
            নোট সেভ করুন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
