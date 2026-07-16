"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, FilePlus2, Settings, LogOut, ShieldCheck, User, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
    <header className="glass-panel no-print sticky top-0 z-40 border-t-0 border-x-0 rounded-none">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="gradient-brand-text hidden text-base leading-6 font-semibold sm:inline">
            YT Director
          </span>
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
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="অ্যাকাউন্ট মেনু" className="gap-1.5 pl-2">
                <User className="size-5" strokeWidth={1.75} />
                <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="size-4" strokeWidth={1.75} />
                  সেটিংস
                </Link>
              </DropdownMenuItem>
              {user.isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <ShieldCheck className="size-4" strokeWidth={1.75} />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" strokeWidth={1.75} />
                লগআউট
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
