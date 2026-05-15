import "server-only";
import OpenAI from "openai";
import { db } from "@/db";
import { aiSettings, aiJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AISettings = {
  baseUrl: string | null;
  apiKey: string | null;
  modelChat: string | null;
  modelScoring: string | null;
};

let cached: { value: AISettings | null; at: number } = { value: null, at: 0 };

export async function getAiSettings(): Promise<AISettings> {
  if (cached.value && Date.now() - cached.at < 30_000) return cached.value;
  const rows = await db.select().from(aiSettings).where(eq(aiSettings.id, 1)).limit(1);
  const row = rows[0];
  const value: AISettings = {
    baseUrl: row?.baseUrl ?? null,
    apiKey: row?.apiKey ?? null,
    modelChat: row?.modelChat ?? null,
    modelScoring: row?.modelScoring ?? null,
  };
  cached = { value, at: Date.now() };
  return value;
}

export function invalidateAiSettingsCache() {
  cached = { value: null, at: 0 };
}

export async function getOpenAIClient(): Promise<OpenAI | null> {
  const s = await getAiSettings();
  if (!s.baseUrl || !s.apiKey) return null;
  return new OpenAI({ baseURL: s.baseUrl, apiKey: s.apiKey });
}

async function logJob<T>(kind: string, request: unknown, fn: () => Promise<T>): Promise<T> {
  const id = crypto.randomUUID();
  const start = Date.now();
  await db.insert(aiJobs).values({ id, kind, status: "running", request: request as object });
  try {
    const result = await fn();
    await db
      .update(aiJobs)
      .set({
        status: "success",
        response: result as object,
        durationMs: Date.now() - start,
      })
      .where(eq(aiJobs.id, id));
    return result;
  } catch (e) {
    await db
      .update(aiJobs)
      .set({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - start,
      })
      .where(eq(aiJobs.id, id));
    throw e;
  }
}

// ---------- High-level AI services ----------

export type QuizScoringResult = {
  score: number;
  bySkill: Record<string, number>;
  strengths: string[];
  improvements: string[];
  tips: string[];
};

export async function scoreQuiz(answers: { qid: string; correct: boolean }[]): Promise<QuizScoringResult> {
  return logJob("score_quiz", { answers }, async () => {
    const correctCount = answers.filter((a) => a.correct).length;
    const score = Math.round((correctCount / Math.max(1, answers.length)) * 100);
    const ratio = correctCount / Math.max(1, answers.length);
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    if (ratio >= 0.8) {
      strengths.push("Nắm vững nội dung chính của bài.");
      strengths.push("Phản xạ chọn đáp án tốt.");
    } else if (ratio >= 0.5) {
      strengths.push("Hiểu được ý chính.");
      improvements.push("Cần đọc/nghe kỹ hơn các chi tiết cụ thể.");
    } else {
      improvements.push("Cần xem lại video và transcript trước khi làm quiz.");
    }
    tips.push("Ghi chú các từ vựng mới vào sổ tay cá nhân.");
    if (ratio < 0.7) tips.push("Thử nghe lại các đoạn transcript được highlight.");
    return { score, bySkill: { vocabulary: score, grammar: score, reading: score, listening: score }, strengths, improvements, tips };
  });
}

export type WritingScoringResult = {
  annotated: { text: string; type: "ok" | "error" | "good" }[];
  skillScores: Record<string, number>;
  suggestions: { quote: string; suggestion: string }[];
};

export async function scoreWriting(input: { text: string; level: string }): Promise<WritingScoringResult> {
  return logJob("score_writing", input, async () => {
    const client = await getOpenAIClient();
    const s = await getAiSettings();
    if (client && s.modelScoring) {
      // Real path. Use OpenAI-compatible JSON output.
      try {
        const resp = await client.chat.completions.create({
          model: s.modelScoring,
          messages: [
            {
              role: "system",
              content:
                "You are an English writing teacher. Score the student's writing for Grammar, Vocabulary, and Coherence (each 0-100). Return JSON.",
            },
            {
              role: "user",
              content: `Level: ${input.level}\nText:\n"""${input.text}"""\n\nReturn JSON: { "grammar": number, "vocabulary": number, "coherence": number, "suggestions": [{ "quote": string, "suggestion": string }] }`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        const content = resp.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        return buildWritingResult(input.text, parsed);
      } catch (e) {
        // Fall through to stub on error
      }
    }
    // Stub
    const score = Math.min(100, 60 + Math.floor(input.text.length / 10));
    return {
      annotated: [{ text: input.text, type: "ok" as const }],
      skillScores:
        input.level === "C1"
          ? { grammar: score, vocabulary: score - 5, coherence: score - 10, style: score - 12 }
          : input.level === "A1" || input.level === "A2"
          ? { grammar: score, vocabulary: score - 5 }
          : { grammar: score, vocabulary: score - 5, coherence: score - 10 },
      suggestions: [],
    };
  });
}

function buildWritingResult(
  text: string,
  parsed: { grammar?: number; vocabulary?: number; coherence?: number; style?: number; suggestions?: { quote: string; suggestion: string }[] }
): WritingScoringResult {
  const annotated: { text: string; type: "ok" | "error" | "good" }[] = [{ text, type: "ok" }];
  // Mark error spans
  for (const sug of parsed.suggestions ?? []) {
    const idx = text.indexOf(sug.quote);
    if (idx >= 0) {
      annotated.length = 0;
      annotated.push(
        { text: text.slice(0, idx), type: "ok" },
        { text: sug.quote, type: "error" },
        { text: text.slice(idx + sug.quote.length), type: "ok" }
      );
      break;
    }
  }
  return {
    annotated,
    skillScores: {
      grammar: parsed.grammar ?? 70,
      vocabulary: parsed.vocabulary ?? 70,
      coherence: parsed.coherence ?? 70,
      ...(parsed.style != null ? { style: parsed.style } : {}),
    },
    suggestions: parsed.suggestions ?? [],
  };
}

export type SpeakingScoringResult = {
  score: number;
  words: { word: string; quality: "good" | "okay" | "poor"; note?: string }[];
  overall: string;
};

export async function scoreSpeaking(input: { targetText: string }): Promise<SpeakingScoringResult> {
  return logJob("score_speaking", input, async () => {
    // Phase 1 stub — Phase 3 will integrate Speechace/Azure
    const words = input.targetText.split(/\s+/);
    const rng = (i: number) => (Math.sin(i * 9.13) + 1) / 2;
    const scored = words.map((w, i) => {
      const r = rng(i);
      const quality: "good" | "okay" | "poor" = r > 0.8 ? "poor" : r > 0.6 ? "okay" : "good";
      return { word: w, quality, note: quality === "poor" ? "Cần luyện phát âm âm cuối" : undefined };
    });
    const goods = scored.filter((s) => s.quality === "good").length;
    const score = Math.round((goods / words.length) * 100);
    const overall =
      score >= 80
        ? "Phát âm rõ ràng, tự nhiên. Tiếp tục phát huy!"
        : score >= 60
        ? "Phát âm khá ổn. Chú ý nhấn trọng âm và âm cuối."
        : "Cần luyện thêm. Hãy nghe và bắt chước cách đọc của AI.";
    return { score, words: scored, overall };
  });
}

// Quiz generation from transcript (phase 2 will plug AI; phase 1 returns deterministic stub)
export async function generateQuizFromTranscript(input: {
  videoTitle: string;
  segments: { en: string; vi: string | null }[];
}) {
  return logJob("generate_quiz", input, async () => {
    const client = await getOpenAIClient();
    const s = await getAiSettings();
    if (client && s.modelChat) {
      try {
        const transcript = input.segments.map((s) => s.en).join("\n");
        const resp = await client.chat.completions.create({
          model: s.modelChat,
          messages: [
            { role: "system", content: "Generate 5 comprehension MCQs from the transcript. JSON only." },
            {
              role: "user",
              content: `Video: ${input.videoTitle}\nTranscript:\n${transcript}\n\nFormat: { "questions": [{ "question": string, "options": [string,string,string,string], "correctIndex": number, "skill": "vocabulary"|"grammar"|"reading"|"listening" }] }`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
        });
        return JSON.parse(resp.choices[0]?.message?.content ?? "{}");
      } catch (e) {
        // fallthrough
      }
    }
    return { questions: [] };
  });
}
