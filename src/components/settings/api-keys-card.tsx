"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client/fetch-json";

type ApiKeyField = "gemini" | "groq" | "pexels" | "pixabay" | "telegramBotToken" | "telegramChatId";

type ApiKeyStatus = { isSet: boolean; last4: string | null };

const FIELDS: { name: ApiKeyField; label: string; required?: boolean }[] = [
  { name: "gemini", label: "Gemini API Key", required: true },
  { name: "groq", label: "Groq API Key (Gemini quota শেষ হলে fallback)" },
  { name: "pexels", label: "Pexels API Key" },
  { name: "pixabay", label: "Pixabay API Key" },
  { name: "telegramBotToken", label: "Telegram Bot Token (ঐচ্ছিক)" },
  { name: "telegramChatId", label: "Telegram Chat ID (ঐচ্ছিক)" },
];

export function ApiKeysCard() {
  const [status, setStatus] = useState<Record<ApiKeyField, ApiKeyStatus> | null>(null);
  const [values, setValues] = useState<Partial<Record<ApiKeyField, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ apiKeys: Record<ApiKeyField, ApiKeyStatus> }>("/api/settings/api-keys")
      .then((data) => setStatus(data.apiKeys))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleSave() {
    const changed = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v && v.trim().length > 0)
    );
    if (Object.keys(changed).length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await fetchJson("/api/settings/api-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      const data = await fetchJson<{ apiKeys: Record<ApiKeyField, ApiKeyStatus> }>(
        "/api/settings/api-keys"
      );
      setStatus(data.apiKeys);
      setValues({});
      toast.success("API key সেভ হয়েছে");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base leading-6 font-semibold">
            <KeyRound className="size-4" strokeWidth={1.75} />
            নিজের API Key
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            এই key গুলো শুধু আপনার নিজের ব্যবহারের জন্য — আপনার usage অন্য কোনো user-এর quota/cost-এ যোগ হবে না। Key গুলো এনক্রিপ্টেড অবস্থায় সেভ থাকে, এখান থেকে আর কখনো দেখা যাবে না।
          </p>
        </div>

        {!status && !error && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        )}

        {error && <p className="text-sm leading-5 text-error">{error}</p>}

        {status && (
          <>
            {FIELDS.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={`key-${field.name}`} className="flex items-center gap-1.5">
                  {field.label}
                  {status[field.name].isSet && (
                    <span className="inline-flex items-center gap-1 text-xs leading-4 text-success">
                      <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
                      সেট করা আছে
                      {status[field.name].last4 && ` (····${status[field.name].last4})`}
                    </span>
                  )}
                </Label>
                <Input
                  id={`key-${field.name}`}
                  type="text"
                  placeholder={status[field.name].isSet ? "পরিবর্তন করতে নতুন value দিন" : "key দিন"}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              </div>
            ))}

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Save className="size-4" strokeWidth={1.75} />
              )}
              সেভ করুন
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
