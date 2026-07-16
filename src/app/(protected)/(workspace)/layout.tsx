"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Scene Review" },
  { href: "/bgm", label: "BGM & SFX" },
  { href: "/guideline", label: "Editing Guideline" },
  { href: "/download", label: "Download Center" },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <nav className="glass-panel no-print border-t-0 border-x-0 rounded-none">
        <div className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative shrink-0 px-3 py-3 text-sm leading-5 font-medium whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:opacity-0 after:transition-opacity",
                  active
                    ? "gradient-brand-text after:gradient-brand after:opacity-100"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
