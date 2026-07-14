"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UploadCloud, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { saveScriptText } from "@/lib/scene-storage";

const ACCEPTED_EXTENSIONS = [".doc", ".docx", ".txt", ".pdf"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MIN_PASTE_LENGTH = 50;

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileSelected(candidate: File | null) {
    if (!candidate) return;
    if (!isAcceptedFile(candidate)) {
      setError("শুধু .doc, .docx, .txt, বা .pdf ফাইল সাপোর্ট করে।");
      setFile(null);
      return;
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setError("ফাইলের সাইজ ১০MB এর বেশি হতে পারবে না।");
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelected(e.dataTransfer.files?.[0] ?? null);
  }

  const canSubmit =
    activeTab === "file"
      ? file !== null
      : pastedText.trim().length >= MIN_PASTE_LENGTH;

  async function handleSubmit() {
    if (activeTab === "paste" && pastedText.trim().length < MIN_PASTE_LENGTH) {
      setError(`স্ক্রিপ্ট অন্তত ${MIN_PASTE_LENGTH} ক্যারেক্টার হতে হবে।`);
      return;
    }
    if (activeTab === "file" && !file) {
      setError("প্রথমে একটা স্ক্রিপ্ট ফাইল দিন।");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      let scriptText = pastedText.trim();

      if (activeTab === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-script", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "ফাইল থেকে টেক্সট বের করা যায়নি।");
          setIsSubmitting(false);
          return;
        }
        scriptText = data.text;
      }

      saveScriptText(scriptText);
      router.push("/processing");
    } catch {
      setError("কিছু একটা ভুল হয়েছে, আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-16 md:px-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl leading-10 font-semibold">স্ক্রিপ্ট আপলোড করুন</h1>
        <p className="text-sm leading-5 text-muted-foreground">
          আপনার ভিডিও স্ক্রিপ্টটি আপলোড করুন অথবা পেস্ট করুন — বাকি কাজ আমরা করে দিচ্ছি।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Script</CardTitle>
          <CardDescription>Supported: .doc, .docx, .txt, .pdf</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "file" | "paste");
              setError(null);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="file" className="flex-1">
                ফাইল আপলোড
              </TabsTrigger>
              <TabsTrigger value="paste" className="flex-1">
                টেক্সট পেস্ট
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              {!file ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <UploadCloud className="size-6 text-muted-foreground" strokeWidth={1.75} />
                  <div className="space-y-1">
                    <p className="text-sm leading-5">
                      ফাইল টেনে আনুন অথবা ক্লিক করে বেছে নিন
                    </p>
                    <p className="text-xs leading-4 text-muted-foreground">
                      .doc, .docx, .txt, .pdf — সর্বোচ্চ ১০MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(",")}
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <p className="truncate text-sm leading-5">{file.name}</p>
                      <p className="text-xs leading-4 text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="ফাইল সরান"
                    onClick={() => setFile(null)}
                  >
                    <X className="size-5" strokeWidth={1.75} />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="paste" className="mt-4">
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="এখানে আপনার স্ক্রিপ্ট পেস্ট করুন..."
                className="min-h-48 resize-y"
              />
              <p className="mt-1 text-right text-xs leading-4 text-muted-foreground">
                {pastedText.trim().length} ক্যারেক্টার
              </p>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm leading-5 text-error">
              <AlertCircle className="size-5 shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />}
        স্ক্রিপ্ট প্রসেস করুন
      </Button>
    </main>
  );
}
