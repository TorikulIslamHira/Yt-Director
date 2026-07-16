import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, ImageOff, Clapperboard } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, projectShareLinks } from "@/db/schema";
import { rowToProject, toShareView } from "@/lib/projects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Params = { params: Promise<{ token: string }> };

export default async function SharePage({ params }: Params) {
  const { token } = await params;

  const link = await db.query.projectShareLinks.findFirst({
    where: eq(projectShareLinks.token, token),
  });
  if (!link) notFound();

  const row = await db.query.projects.findFirst({ where: eq(projects.id, link.projectId) });
  if (!row) notFound();

  const project = toShareView(rowToProject(row));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl leading-8 font-semibold">
          <Clapperboard className="size-5" strokeWidth={1.75} />
          {project.title}
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          এডিটিং গাইডলাইন — শুধু দেখার জন্য শেয়ার করা লিংক।
        </p>
      </div>

      <div className="space-y-3">
        {project.scenes.map((scene) => (
          <Card key={scene.id}>
            <CardContent className="flex gap-3">
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-muted">
                {scene.stockMatches[0]?.thumbnailUrl ? (
                  <Image
                    src={scene.stockMatches[0].thumbnailUrl}
                    alt={scene.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm leading-5 font-medium">
                    {scene.index}. {scene.title}
                  </p>
                  <Badge variant={scene.status === "stock-match" ? "default" : "secondary"}>
                    {scene.status === "stock-match" ? "স্টক ম্যাচ" : "এআই প্রম্পট"}
                  </Badge>
                </div>
                <p className="text-xs leading-4 text-muted-foreground">{scene.description}</p>
                <div className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
                  <Clock className="size-3.5" strokeWidth={1.75} />
                  <span>~{scene.estimatedDurationSeconds}s</span>
                </div>
                {scene.editingNote && (
                  <p className="text-xs leading-4 text-muted-foreground">নোট: {scene.editingNote}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
