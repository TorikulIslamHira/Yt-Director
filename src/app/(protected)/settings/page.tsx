"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiKeysCard } from "@/components/settings/api-keys-card";
import { fetchJson } from "@/lib/client/fetch-json";
import type { AppSettings } from "@/types/scene";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ settings: AppSettings }>("/api/settings")
      .then((data) => setSettings(data.settings))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setIsSaving(true);
    setError(null);
    try {
      const data = await fetchJson<{ settings: AppSettings }>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      toast.success("সেটিংস সেভ হয়েছে");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
          <Settings className="size-5" strokeWidth={1.75} />
          সেটিংস
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          এই মানগুলো পরবর্তী সব স্ক্রিপ্ট প্রসেসিং-এ ব্যবহার হবে।
        </p>
      </div>

      {!settings && !error && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {error && <p className="text-sm leading-5 text-error">{error}</p>}

      {settings && (
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wpm-bn">পড়ার গতি — বাংলা (শব্দ/মিনিট)</Label>
              <Input
                id="wpm-bn"
                type="number"
                min={50}
                max={400}
                value={settings.readingSpeedBn}
                onChange={(e) =>
                  setSettings({ ...settings, readingSpeedBn: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wpm-en">পড়ার গতি — ইংরেজি (শব্দ/মিনিট)</Label>
              <Input
                id="wpm-en"
                type="number"
                min={50}
                max={400}
                value={settings.readingSpeedEn}
                onChange={(e) =>
                  setSettings({ ...settings, readingSpeedEn: Number(e.target.value) })
                }
              />
            </div>

            <p className="text-xs leading-4 text-muted-foreground">
              এই মান দিয়ে প্রতিটা দৃশ্যের আনুমানিক সময় (এবং তাই স্টক ক্লিপের দৈর্ঘ্য) হিসাব করা হয় — আসল ভয়েসওভার থেকে না, শব্দসংখ্যা থেকে অনুমান করা।
            </p>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Save className="size-4" strokeWidth={1.75} />
              )}
              সেভ করুন
            </Button>
          </CardContent>
        </Card>
      )}

      <ApiKeysCard />
    </main>
  );
}
