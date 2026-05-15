"use server";

import { z } from "zod";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { invalidateAiSettingsCache, getOpenAIClient, getAiSettings } from "@/lib/ai";
import OpenAI from "openai";

const schema = z.object({
  baseUrl: z.string().url().or(z.literal("")).nullable(),
  apiKey: z.string().nullable(),
  modelChat: z.string().nullable(),
  modelScoring: z.string().nullable(),
  modelEmbedding: z.string().nullable(),
  whisperBaseUrl: z.string().url().or(z.literal("")).nullable(),
  whisperApiKey: z.string().nullable(),
  whisperModel: z.string().nullable(),
  ttsBaseUrl: z.string().url().or(z.literal("")).nullable(),
  ttsApiKey: z.string().nullable(),
  ttsModel: z.string().nullable(),
});

async function ensureAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

export async function saveAiSettings(input: z.infer<typeof schema>) {
  await ensureAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.message };
  const v = {
    ...parsed.data,
    updatedAt: new Date(),
  };
  await db
    .insert(aiSettings)
    .values({ id: 1, ...v })
    .onDuplicateKeyUpdate({ set: v });
  invalidateAiSettingsCache();
  return { ok: true as const };
}

export async function testAiConnection(input: { baseUrl: string; apiKey: string; model: string }) {
  await ensureAdmin();
  if (!input.baseUrl || !input.apiKey || !input.model) {
    return { ok: false as const, error: "Cần nhập đầy đủ baseUrl, apiKey, model" };
  }
  try {
    const client = new OpenAI({ baseURL: input.baseUrl, apiKey: input.apiKey });
    const r = await client.chat.completions.create({
      model: input.model,
      messages: [{ role: "user", content: "Reply with only the word 'pong' (lowercase)." }],
      max_tokens: 10,
      temperature: 0,
    });
    const content = r.choices[0]?.message?.content?.trim() ?? "";
    return { ok: true as const, response: content, model: r.model };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}
