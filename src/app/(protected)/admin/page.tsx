"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { fetchJson } from "@/lib/client/fetch-json";

type AdminUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: number;
  projectCount: number;
  completedCount: number;
  lastActivityAt: number | null;
  apiKeysSet: {
    gemini: boolean;
    groq: boolean;
    pexels: boolean;
    pixabay: boolean;
    telegram: boolean;
  };
};

const KEY_LABELS: { key: keyof AdminUser["apiKeysSet"]; label: string }[] = [
  { key: "gemini", label: "Gemini" },
  { key: "groq", label: "Groq" },
  { key: "pexels", label: "Pexels" },
  { key: "pixabay", label: "Pixabay" },
  { key: "telegram", label: "Telegram" },
];

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchJson<{ users: AdminUser[] }>("/api/admin/users")
      .then((data) => setUsers(data.users))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
          <ShieldCheck className="size-5" strokeWidth={1.75} />
          Admin — ইউজার তালিকা
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          কতজন ইউজার আছে, তাদের প্রজেক্ট সংখ্যা, কোন API key সেট করা আছে — সব এখান থেকে দেখা যাবে। প্রয়োজনে পাসওয়ার্ড রিসেটও করে দিতে পারবেন।
        </p>
      </div>

      {!users && !error && (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {error && <p className="text-sm leading-5 text-error">{error}</p>}

      {users && (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-5 font-medium">{u.email}</span>
                      {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
                    </div>
                    <p className="text-xs leading-4 text-muted-foreground">
                      যোগ দিয়েছেন: {new Date(u.createdAt).toLocaleString()}
                      {u.lastActivityAt && ` · সর্বশেষ কার্যক্রম: ${new Date(u.lastActivityAt).toLocaleString()}`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setResetTarget(u)}>
                    <KeyRound className="size-4" strokeWidth={1.75} />
                    পাসওয়ার্ড রিসেট
                  </Button>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs leading-4 text-muted-foreground">
                  <span>মোট প্রজেক্ট: {u.projectCount}</span>
                  <span>সম্পন্ন: {u.completedCount}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {KEY_LABELS.map(({ key, label }) => (
                    <Badge key={key} variant={u.apiKeysSet[key] ? "default" : "secondary"} className="gap-1">
                      {u.apiKeysSet[key] ? (
                        <CheckCircle2 className="size-3" strokeWidth={1.75} />
                      ) : (
                        <XCircle className="size-3" strokeWidth={1.75} />
                      )}
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resetTarget && (
        <ResetPasswordDialog
          userId={resetTarget.id}
          email={resetTarget.email}
          open={!!resetTarget}
          onOpenChange={(open) => !open && setResetTarget(null)}
        />
      )}
    </main>
  );
}
