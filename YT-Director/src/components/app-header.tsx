import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-base leading-6 font-semibold">
          yt-director
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
