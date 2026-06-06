import { ImportClient } from "./ImportClient";

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Bulk import</h1>
        <p className="text-muted text-sm mt-1">
          Upload one or more JSON / YAML files containing lessons or exercises.
          You&apos;ll see a preview before anything is written.
        </p>
      </header>

      <details className="rounded-xl border border-border bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Accepted file shapes</summary>
        <div className="mt-3 space-y-3 text-muted">
          <p>Each file may use any of these shapes:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>
              <strong className="text-foreground">Wrapper</strong> —{" "}
              <code>{`{ lessons: [...], exercises: [...] }`}</code>
            </li>
            <li>
              <strong className="text-foreground">Array</strong> — a mixed list; each item is treated as a
              lesson if it has a <code>category</code> field, or an exercise if it has a <code>skill</code> field.
            </li>
            <li>
              <strong className="text-foreground">Single record</strong> — a lone object; type inferred the same way.
            </li>
          </ol>
          <p>
            Lesson fields: <code>slug, category, title, level (A1-C2), description?, transcript, segments[]</code>.
            <br />
            Exercise fields: <code>slug, skill, title, level, type (mcq|fill|match), description?, questions[], exam?</code>.
            <br />
            <code>exam</code> (optional): <code>&quot;toeic&quot; | &quot;toefl&quot; | &quot;ielts&quot; | &quot;oet&quot;</code> — tags the exercise for exam-prep mock tests. Omit to leave untagged.
          </p>
        </div>
      </details>

      <ImportClient />
    </div>
  );
}
