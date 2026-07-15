"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/client/fetch-json";
import type { PostedPlatform, Project } from "@/types/scene";

const PLATFORMS: { value: PostedPlatform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "অন্যান্য" },
];

export function AddPostedLinkDialog({
  projectId,
  open,
  isFirstLink,
  onOpenChange,
  onAdded,
}: {
  projectId: string;
  open: boolean;
  isFirstLink: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (project: Project) => void;
}) {
  const [platform, setPlatform] = useState<PostedPlatform>("youtube");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!url.trim()) {
      setError("পোস্ট করা লিংক দিন।");
      return;
    }
    setIsSubmitting(true);
    try {
      const { project } = await fetchJson<{ project: Project }>(
        `/api/projects/${projectId}/posted-links`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim(), platform }),
        }
      );
      toast.success(isFirstLink ? "প্রজেক্ট সম্পন্ন হিসেবে চিহ্নিত হয়েছে" : "লিংক যোগ হয়েছে");
      setUrl("");
      onOpenChange(false);
      onAdded(project);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isFirstLink ? "সম্পন্ন হিসেবে চিহ্নিত করুন" : "আরেকটা লিংক যোগ করুন"}</DialogTitle>
          <DialogDescription>ভিডিওটা কোথায় পোস্ট করা হয়েছে, তার লিংক দিন।</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>প্ল্যাটফর্ম</Label>
            <div className="flex gap-1.5">
              {PLATFORMS.map((p) => (
                <Badge
                  key={p.value}
                  variant={platform === p.value ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setPlatform(p.value)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="posted-url">পোস্ট লিংক</Label>
            <Input
              id="posted-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && <p className="text-sm leading-5 text-error">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <CheckCircle2 className="size-4" strokeWidth={1.75} />
            )}
            নিশ্চিত করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
