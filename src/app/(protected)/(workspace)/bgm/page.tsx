import { Music, Clock3 } from "lucide-react";

export default function BgmPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
          <Music className="size-5" strokeWidth={1.75} />
          ব্যাকগ্রাউন্ড মিউজিক
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          ElevenLabs ইন্টিগ্রেশন দিয়ে শীঘ্রই আসছে।
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-sm leading-5 text-muted-foreground">
        <Clock3 className="size-5 shrink-0" strokeWidth={1.75} />
        <span>এই ফিচারটি এখনো যোগ করা হয়নি — শীঘ্রই আসছে।</span>
      </div>

      <div className="space-y-2 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 text-lg leading-7 font-semibold">
          সিন-ট্রানজিশন সাউন্ড এফেক্ট
        </h2>
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-sm leading-5 text-muted-foreground">
          <Clock3 className="size-5 shrink-0" strokeWidth={1.75} />
          <span>এই ফিচারটি এখনো যোগ করা হয়নি — শীঘ্রই আসছে।</span>
        </div>
      </div>
    </main>
  );
}
