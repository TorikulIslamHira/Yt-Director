import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="glass-panel no-print border-t-0 border-x-0 rounded-none">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="gradient-brand-text text-base leading-6 font-semibold">YT Director</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
