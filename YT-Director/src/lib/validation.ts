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

export const generateBgmSchema = z.object({
  genre: z.string().min(1),
  durationSeconds: z.number().int().positive().default(30),
  projectId: z.string().optional(),
});

export const downloadZipSchema = z.object({
  scenes: z.array(sceneSchema).min(1),
  projectId: z.string().optional(),
});

export const createProjectSchema = z.object({
  scriptText: z.string().min(20),
});

export const updateProjectSchema = z
  .object({
    scenes: z.array(sceneSchema).optional(),
    bgm: bgmInfoSchema.optional(),
  })
  .refine((data) => data.scenes !== undefined || data.bgm !== undefined, {
    message: "scenes বা bgm এর একটি অন্তত দিতে হবে।",
  });
