"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, FilePlus2, Settings, LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { clearProject } from "@/lib/client/scene-storage";

type AppHeaderProps = {
  user: { id: string; email: string; isAdmin: boolean };
};

export function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter();

  function handleNewProject() {
    clearProject();
    router.push("/");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-base leading-6 font-semibold">
          yt-director
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="নতুন প্রজেক্ট" onClick={handleNewProject}>
            <FilePlus2 className="size-5" strokeWidth={1.75} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="প্রজেক্ট হিস্টরি" asChild>
            <Link href="/history">
              <History className="size-5" strokeWidth={1.75} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="সেটিংস" asChild>
            <Link href="/settings">
              <Settings className="size-5" strokeWidth={1.75} />
            </Link>
          </Button>
          {user.isAdmin && (
            <Button variant="ghost" size="icon" aria-label="Admin" asChild>
              <Link href="/admin">
                <ShieldCheck className="size-5" strokeWidth={1.75} />
              </Link>
            </Button>
          )}
          <ThemeToggle />
          <span className="mx-1 hidden text-xs leading-4 text-muted-foreground sm:inline">
            {user.email}
          </span>
          <Button variant="ghost" size="icon" aria-label="লগআউট" onClick={handleLogout}>
            <LogOut className="size-5" strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </header>
  );
}
