import { z } from "zod";

export const stockMatchSchema = z.object({
  id: z.string(),
  source: z.enum(["pexels", "pixabay"]),
  thumbnailUrl: z.string(),
  downloadUrl: z.string(),
  durationSeconds: z.number(),
});

export const sceneSchema = z.object({
  id: z.string(),
  index: z.number(),
  title: z.string(),
  description: z.string(),
  estimatedDurationSeconds: z.number(),
  status: z.enum(["stock-match", "ai-prompt"]),
  stockMatches: z.array(stockMatchSchema),
  aiPrompt: z.string().nullable(),
  editingNote: z.string(),
});

export const bgmInfoSchema = z.object({
  genre: z.string(),
  durationSeconds: z.number(),
});

export const generateScenesSchema = z.object({
  text: z.string().min(20),
});

export const generateMetadataSchema = z.object({
  scriptText: z.string().min(20),
});

export const downloadZipSchema = z.object({
  scenes: z.array(sceneSchema).min(1),
  projectId: z.string().optional(),
});

export const createProjectSchema = z.object({
  scriptText: z.string().min(20),
  title: z.string().trim().min(1).max(120).optional(),
});

export const updateProjectSchema = z
  .object({
    scenes: z.array(sceneSchema).optional(),
    bgm: bgmInfoSchema.optional(),
    status: z.enum(["draft", "editing", "completed"]).optional(),
  })
  .refine((data) => data.scenes !== undefined || data.bgm !== undefined || data.status !== undefined, {
    message: "scenes, bgm বা status এর একটি অন্তত দিতে হবে।",
  });

export const addPostedLinkSchema = z.object({
  url: z.string().trim().url("সঠিক একটা লিংক দিন।"),
  platform: z.enum(["youtube", "facebook", "other"]),
});

export const restoreVersionSchema = z.object({
  index: z.number().int().min(0),
});

export const settingsSchema = z.object({
  readingSpeedBn: z.number().int().min(50).max(400),
  readingSpeedEn: z.number().int().min(50).max(400),
});
