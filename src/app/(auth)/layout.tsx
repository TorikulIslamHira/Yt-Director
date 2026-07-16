import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center text-base leading-6 font-semibold">
          yt-director
        </Link>
        {children}
      </div>
    </main>
  );
}
