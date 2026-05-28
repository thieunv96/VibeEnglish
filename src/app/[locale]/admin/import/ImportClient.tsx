"use client";

import { useState } from "react";
import YAML from "yaml";
import { toast } from "sonner";

type Status =
  | "new"
  | "update"
  | "invalid"
  | "created"
  | "updated"
  | "failed";

interface RecordResult {
  index: number;
  slug: string;
  title: string;
  group: string;
  level?: string;
  status: Status;
  error?: string;
}

interface ApiResponse {
  mode: "preview" | "commit";
  lessons: RecordResult[];
  exercises: RecordResult[];
}

interface ParsedFile {
  filename: string;
  lessons: unknown[];
  exercises: unknown[];
  error?: string;
}

function parseFileText(filename: string, text: string): ParsedFile {
  const ext = filename.toLowerCase().split(".").pop();
  let parsed: unknown;
  try {
    if (ext === "yaml" || ext === "yml") {
      parsed = YAML.parse(text);
    } else {
      parsed = JSON.parse(text);
    }
  } catch (e) {
    return {
      filename,
      lessons: [],
      exercises: [],
      error: e instanceof Error ? e.message : "parse error",
    };
  }
  return { filename, ...normalize(parsed) };
}

function normalize(parsed: unknown): { lessons: unknown[]; exercises: unknown[] } {
  const lessons: unknown[] = [];
  const exercises: unknown[] = [];

  const pushItem = (item: unknown) => {
    if (!item || typeof item !== "object") return;
    const obj = item as Record<string, unknown>;
    if ("category" in obj && !("skill" in obj)) lessons.push(obj);
    else if ("skill" in obj && !("category" in obj)) exercises.push(obj);
    else if ("segments" in obj && !("questions" in obj)) lessons.push(obj);
    else if ("questions" in obj && !("segments" in obj)) exercises.push(obj);
  };

  if (Array.isArray(parsed)) {
    parsed.forEach(pushItem);
    return { lessons, exercises };
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.lessons) || Array.isArray(obj.exercises)) {
      if (Array.isArray(obj.lessons)) obj.lessons.forEach((l) => lessons.push(l));
      if (Array.isArray(obj.exercises)) obj.exercises.forEach((e) => exercises.push(e));
      return { lessons, exercises };
    }
    pushItem(parsed);
  }
  return { lessons, exercises };
}

const statusBadgeClass: Record<Status, string> = {
  new: "bg-emerald-100 text-emerald-800",
  update: "bg-amber-100 text-amber-800",
  invalid: "bg-rose-100 text-rose-800",
  created: "bg-emerald-100 text-emerald-800",
  updated: "bg-sky-100 text-sky-800",
  failed: "bg-rose-100 text-rose-800",
};

export function ImportClient() {
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [preview, setPreview] = useState<ApiResponse | null>(null);
  const [commitResult, setCommitResult] = useState<ApiResponse | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFiles(list: FileList | null) {
    if (!list) return;
    setPreview(null);
    setCommitResult(null);
    const reads: Promise<ParsedFile>[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      reads.push(
        f.text().then((text) => parseFileText(f.name, text)),
      );
    }
    Promise.all(reads).then((parsed) => setFiles(parsed));
  }

  const totalLessons = files.reduce((n, f) => n + f.lessons.length, 0);
  const totalExercises = files.reduce((n, f) => n + f.exercises.length, 0);
  const parseErrors = files.filter((f) => f.error);

  async function runPreview() {
    setBusy(true);
    try {
      const lessons = files.flatMap((f) => f.lessons);
      const exercises = files.flatMap((f) => f.exercises);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview", lessons, exercises }),
      });
      if (!res.ok) {
        toast.error("Preview failed");
        return;
      }
      setPreview((await res.json()) as ApiResponse);
      setCommitResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!preview) return;
    setBusy(true);
    try {
      const lessons = files.flatMap((f) => f.lessons);
      const exercises = files.flatMap((f) => f.exercises);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "commit", lessons, exercises }),
      });
      if (!res.ok) {
        toast.error("Import failed");
        return;
      }
      const data = (await res.json()) as ApiResponse;
      setCommitResult(data);
      const created =
        data.lessons.filter((r) => r.status === "created").length +
        data.exercises.filter((r) => r.status === "created").length;
      const updated =
        data.lessons.filter((r) => r.status === "updated").length +
        data.exercises.filter((r) => r.status === "updated").length;
      const failed =
        data.lessons.filter((r) => r.status === "failed").length +
        data.exercises.filter((r) => r.status === "failed").length;
      toast.success(`Imported: ${created} created, ${updated} updated${failed ? `, ${failed} failed` : ""}`);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFiles([]);
    setPreview(null);
    setCommitResult(null);
  }

  const display = commitResult ?? preview;
  const previewValidCount = preview
    ? preview.lessons.filter((r) => r.status !== "invalid").length +
      preview.exercises.filter((r) => r.status !== "invalid").length
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Choose files (.json / .yaml / .yml)</span>
          <input
            type="file"
            multiple
            accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
            data-testid="admin-import-files"
            disabled={busy}
            onChange={(e) => pickFiles(e.target.files)}
            className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-brand-strong"
          />
        </label>

        {files.length > 0 && (
          <div className="text-sm space-y-2">
            <p className="text-muted">
              <strong className="text-foreground">{files.length}</strong> file
              {files.length === 1 ? "" : "s"} parsed —{" "}
              <strong className="text-foreground">{totalLessons}</strong> lesson candidates,{" "}
              <strong className="text-foreground">{totalExercises}</strong> exercise candidates.
            </p>
            {parseErrors.length > 0 && (
              <ul className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                {parseErrors.map((f) => (
                  <li key={f.filename}>
                    <code className="font-mono">{f.filename}</code>: {f.error}
                  </li>
                ))}
              </ul>
            )}
            <details>
              <summary className="cursor-pointer text-xs text-muted">Files</summary>
              <ul className="mt-2 text-xs text-muted space-y-1">
                {files.map((f) => (
                  <li key={f.filename}>
                    <code className="font-mono">{f.filename}</code> — {f.lessons.length}L /{" "}
                    {f.exercises.length}E
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="admin-import-preview"
            onClick={runPreview}
            disabled={busy || files.length === 0 || totalLessons + totalExercises === 0}
            className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Working…" : "Preview"}
          </button>
          {preview && !commitResult && (
            <button
              type="button"
              data-testid="admin-import-commit"
              onClick={runCommit}
              disabled={busy || previewValidCount === 0}
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 text-sm disabled:opacity-50"
            >
              Confirm import ({previewValidCount} valid)
            </button>
          )}
          {(preview || commitResult || files.length > 0) && (
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="rounded-md border border-border hover:bg-surface font-semibold px-4 py-2 text-sm"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {display && (
        <div className="space-y-6">
          <ResultTable
            title="Lessons"
            rows={display.lessons}
            groupLabel="Category"
            testId="admin-import-lessons-table"
          />
          <ResultTable
            title="Exercises"
            rows={display.exercises}
            groupLabel="Skill"
            testId="admin-import-exercises-table"
          />
        </div>
      )}
    </div>
  );
}

function ResultTable({
  title,
  rows,
  groupLabel,
  testId,
}: {
  title: string;
  rows: RecordResult[];
  groupLabel: string;
  testId: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border bg-surface px-4 py-2 text-sm font-semibold">
        {title} ({rows.length})
      </div>
      <table className="min-w-full text-left text-sm" data-testid={testId}>
        <thead className="bg-surface text-xs text-muted">
          <tr>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Slug</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">{groupLabel}</th>
            <th className="px-4 py-2">Level</th>
            <th className="px-4 py-2">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={`${r.index}-${r.slug}`}>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${statusBadgeClass[r.status]}`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-xs">{r.slug}</td>
              <td className="px-4 py-2">{r.title}</td>
              <td className="px-4 py-2 text-muted">{r.group}</td>
              <td className="px-4 py-2 text-muted">{r.level ?? "—"}</td>
              <td className="px-4 py-2 text-xs text-rose-700">{r.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
