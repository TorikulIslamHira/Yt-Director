"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/client/fetch-json";

export function ShareLinkDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open) return;
      if (!cancelled) setToken(undefined);
      try {
        const data = await fetchJson<{ token: string | null }>(`/api/projects/${projectId}/share`);
        if (!cancelled) setToken(data.token);
      } catch {
        if (!cancelled) setToken(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  async function handleCreate() {
    setIsBusy(true);
    try {
      const data = await fetchJson<{ token: string }>(`/api/projects/${projectId}/share`, {
        method: "POST",
      });
      setToken(data.token);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRevoke() {
    setIsBusy(true);
    try {
      await fetch(`/api/projects/${projectId}/share`, { method: "DELETE" });
      setToken(null);
      toast.success("লিংক বন্ধ করা হয়েছে");
    } finally {
      setIsBusy(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    toast.success("লিংক কপি হয়েছে");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>শেয়ার লিংক</DialogTitle>
          <DialogDescription>
            এই লিংক দিয়ে যেকেউ (লগইন ছাড়াই) প্রজেক্টের দৃশ্য ও এডিটিং গাইডলাইন শুধু দেখতে পারবে — স্ক্রিপ্ট টেক্সট বা এডিট করার অপশন দেখা যাবে না।
          </DialogDescription>
        </DialogHeader>

        {token === undefined && (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" strokeWidth={1.75} />
        )}

        {token === null && (
          <Button onClick={handleCreate} disabled={isBusy}>
            <Link2 className="size-4" strokeWidth={1.75} />
            শেয়ার লিংক তৈরি করুন
          </Button>
        )}

        {token && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly onFocus={(e) => e.target.select()} />
              <Button size="icon" variant="outline" onClick={handleCopy} aria-label="কপি করুন">
                <Copy className="size-4" strokeWidth={1.75} />
              </Button>
            </div>
            <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={isBusy}>
              <Trash2 className="size-4" strokeWidth={1.75} />
              লিংক বন্ধ করুন
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
