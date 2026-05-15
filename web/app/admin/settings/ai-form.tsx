"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAiSettings, testAiConnection } from "./actions";
import { Check, Loader2, Plug, Save } from "lucide-react";
import type { AiSettings } from "@/db/schema";
import { cn } from "@/lib/utils";

export function AiSettingsForm({ initial }: { initial: AiSettings | null }) {
  const tCommon = useTranslations("common");
  const [form, setForm] = useState({
    baseUrl: initial?.baseUrl ?? "",
    apiKey: initial?.apiKey ?? "",
    modelChat: initial?.modelChat ?? "",
    modelScoring: initial?.modelScoring ?? "",
    modelEmbedding: initial?.modelEmbedding ?? "",
    whisperBaseUrl: initial?.whisperBaseUrl ?? "",
    whisperApiKey: initial?.whisperApiKey ?? "",
    whisperModel: initial?.whisperModel ?? "",
    ttsBaseUrl: initial?.ttsBaseUrl ?? "",
    ttsApiKey: initial?.ttsApiKey ?? "",
    ttsModel: initial?.ttsModel ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; msg: string }>(null);
  const [saved, setSaved] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  const handleSave = () => {
    startTransition(async () => {
      const r = await saveAiSettings({
        baseUrl: form.baseUrl || null,
        apiKey: form.apiKey || null,
        modelChat: form.modelChat || null,
        modelScoring: form.modelScoring || null,
        modelEmbedding: form.modelEmbedding || null,
        whisperBaseUrl: form.whisperBaseUrl || null,
        whisperApiKey: form.whisperApiKey || null,
        whisperModel: form.whisperModel || null,
        ttsBaseUrl: form.ttsBaseUrl || null,
        ttsApiKey: form.ttsApiKey || null,
        ttsModel: form.ttsModel || null,
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await testAiConnection({
      baseUrl: form.baseUrl,
      apiKey: form.apiKey,
      model: form.modelChat,
    });
    if (r.ok) {
      setTestResult({ ok: true, msg: `OK — model trả lời: "${r.response}" (${r.model})` });
    } else {
      setTestResult({ ok: false, msg: r.error });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <Section title="Chat / Generation (vLLM OpenAI-compatible)">
        <p className="text-xs text-stone-500 mb-3">
          Dùng cho: tạo quiz từ transcript, content intel suggestions, generate writing prompt, generate outline video.
        </p>
        <Field label="Base URL" hint="VD: http://localhost:8000/v1">
          <Input value={form.baseUrl} onChange={(e) => update("baseUrl", e.target.value)} placeholder="http://localhost:8000/v1" />
        </Field>
        <Field label="API Key">
          <Input type="password" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} placeholder="EMPTY hoặc key thật" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Model — Chat" hint="Generate quiz, content gen">
            <Input value={form.modelChat} onChange={(e) => update("modelChat", e.target.value)} placeholder="Qwen/Qwen2.5-32B-Instruct" />
          </Field>
          <Field label="Model — Scoring" hint="Chấm writing">
            <Input value={form.modelScoring} onChange={(e) => update("modelScoring", e.target.value)} placeholder="(có thể giống Chat)" />
          </Field>
          <Field label="Model — Embedding" hint="Cho phase 2 (recommendation)">
            <Input value={form.modelEmbedding} onChange={(e) => update("modelEmbedding", e.target.value)} placeholder="(optional)" />
          </Field>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            Test
          </Button>
          {testResult && (
            <span className={cn("text-sm", testResult.ok ? "text-emerald-600" : "text-red-600")}>
              {testResult.msg}
            </span>
          )}
        </div>
      </Section>

      <Section title="Speech-to-text (transcribe audio / video)">
        <p className="text-xs text-stone-500 mb-3">
          Whisper hoặc tương đương. Dùng cho: pull transcript từ video không có caption, transcribe giọng speaking.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Base URL">
            <Input value={form.whisperBaseUrl} onChange={(e) => update("whisperBaseUrl", e.target.value)} />
          </Field>
          <Field label="API Key">
            <Input type="password" value={form.whisperApiKey} onChange={(e) => update("whisperApiKey", e.target.value)} />
          </Field>
          <Field label="Model">
            <Input value={form.whisperModel} onChange={(e) => update("whisperModel", e.target.value)} placeholder="whisper-large-v3" />
          </Field>
        </div>
      </Section>

      <Section title="Text-to-speech (audio mẫu speaking)">
        <p className="text-xs text-stone-500 mb-3">Dùng cho: tạo audio đọc mẫu cho bài Speaking.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Base URL">
            <Input value={form.ttsBaseUrl} onChange={(e) => update("ttsBaseUrl", e.target.value)} />
          </Field>
          <Field label="API Key">
            <Input type="password" value={form.ttsApiKey} onChange={(e) => update("ttsApiKey", e.target.value)} />
          </Field>
          <Field label="Model">
            <Input value={form.ttsModel} onChange={(e) => update("ttsModel", e.target.value)} placeholder="tts-1 / xtts-v2" />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 bg-stone-50 py-3 -mx-6 px-6 border-t border-stone-200 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <Check className="size-4" /> {tCommon("saved")}
          </span>
        )}
        <Button onClick={handleSave} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} <Save className="size-4" /> {tCommon("save")}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
    </div>
  );
}
