"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/client/fetch-json";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await fetchJson("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      router.push("/settings");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-xl leading-7 font-semibold">সাইন-আপ করুন</h1>

          <div className="space-y-1.5">
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <p className="text-xs leading-4 text-muted-foreground">
            অ্যাকাউন্ট তৈরির পর Settings থেকে নিজের Gemini/Groq/Pexels/Pixabay API key যোগ করতে হবে — নাহলে স্ক্রিপ্ট প্রসেস করা যাবে না।
          </p>

          {error && <p className="text-sm leading-5 text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <UserPlus className="size-4" strokeWidth={1.75} />
            )}
            সাইন-আপ
          </Button>

          <p className="text-center text-sm leading-5 text-muted-foreground">
            আগে থেকেই অ্যাকাউন্ট আছে?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-2">
              লগইন করুন
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
