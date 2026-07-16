import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex flex-col items-center gap-2">
          <Logo size={56} />
          <span className="gradient-brand-text text-lg leading-7 font-semibold">YT Director</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
