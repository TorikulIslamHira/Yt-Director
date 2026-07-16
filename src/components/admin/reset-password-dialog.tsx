"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/client/fetch-json";

export function ResetPasswordDialog({
  userId,
  email,
  open,
  onOpenChange,
}: {
  userId: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (newPassword.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchJson(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      toast.success(`${email}-এর পাসওয়ার্ড রিসেট হয়েছে`);
      setNewPassword("");
      onOpenChange(false);
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
          <DialogTitle>পাসওয়ার্ড রিসেট করুন</DialogTitle>
          <DialogDescription>
            {email}-এর জন্য নতুন পাসওয়ার্ড দিন — এতে তার আগের সব session logout হয়ে যাবে।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">নতুন পাসওয়ার্ড</Label>
            <Input
              id="new-password"
              type="text"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="কমপক্ষে ৮ অক্ষর"
            />
          </div>

          {error && <p className="text-sm leading-5 text-error">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <KeyRound className="size-4" strokeWidth={1.75} />
            )}
            রিসেট করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
