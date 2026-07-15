"use client";

import { useState } from "react";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadScriptText } from "@/lib/client/scene-storage";
import { readErrorMessage } from "@/lib/client/fetch-json";
import type { VideoMetadata } from "@/lib/integrations/gemini";

async function copy(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} কপি হয়েছে`);
}

export function VideoMetadataCard() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const scriptText = loadScriptText();
    if (!scriptText) {
      setError("কোনো স্ক্রিপ্ট পাওয়া যায়নি — আগে একটা প্রজেক্ট প্রসেস করুন।");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "মেটাডেটা তৈরি করা যায়নি।"));
      const data: { metadata: VideoMetadata } = await res.json();
      setMetadata(data.metadata);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm leading-5 font-medium">ইউটিউব মেটাডেটা (টাইটেল, বর্ণনা, ট্যাগ)</p>
          <Button size="sm" variant="outline" disabled={isGenerating} onClick={handleGenerate}>
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Sparkles className="size-4" strokeWidth={1.75} />
            )}
            তৈরি করুন
          </Button>
        </div>

        {error && <p className="text-sm leading-5 text-error">{error}</p>}

        {metadata && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs leading-4 font-medium text-muted-foreground">টাইটেল (৩টা অপশন)</p>
              <div className="space-y-1.5">
                {metadata.titles.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
                  >
                    <p className="text-sm leading-5">{title}</p>
                    <Button size="icon-sm" variant="ghost" onClick={() => copy(title, "টাইটেল")}>
                      <Copy className="size-3.5" strokeWidth={1.75} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs leading-4 font-medium text-muted-foreground">বর্ণনা</p>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => copy(metadata.description, "বর্ণনা")}
                >
                  <Copy className="size-3.5" strokeWidth={1.75} />
                </Button>
              </div>
              <p className="text-sm leading-5 text-muted-foreground">{metadata.description}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs leading-4 font-medium text-muted-foreground">ট্যাগ</p>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => copy(metadata.tags.join(", "), "ট্যাগ")}
                >
                  <Copy className="size-3.5" strokeWidth={1.75} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
