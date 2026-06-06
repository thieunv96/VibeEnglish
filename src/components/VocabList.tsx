"use client";

import { useState } from "react";
import { toast } from "sonner";

interface VocabRow {
  id: string;
  word: string;
  definition: string | null;
  addedAt: string;
  sourceLessonSlug?: string | null;
}

interface Props {
  initialItems: VocabRow[];
  labels: {
    word: string;
    definition: string;
    noDefinition: string;
    edit: string;
    save: string;
    cancel: string;
    delete: string;
    saveFailed: string;
    definitionPlaceholder: string;
  };
}

export function VocabList({ initialItems, labels }: Props) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function remove(id: string) {
    const before = items;
    setItems(items.filter((i) => i.id !== id));
    const res = await fetch(`/api/vocab?id=${id}`, { method: "DELETE" });
    if (!res.ok) setItems(before);
  }

  function startEdit(item: VocabRow) {
    setEditingId(item.id);
    setEditValue(item.definition ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEdit(item: VocabRow) {
    const next = editValue.trim();
    // POST /api/vocab is an upsert keyed on (userId, word), so resending the
    // same word with a new definition updates in place.
    const res = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: item.word,
        definition: next || undefined,
        sourceLessonSlug: item.sourceLessonSlug ?? undefined,
      }),
    });
    if (!res.ok) {
      toast.error(labels.saveFailed);
      return;
    }
    setItems((curr) =>
      curr.map((i) => (i.id === item.id ? { ...i, definition: next || null } : i)),
    );
    cancelEdit();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white" data-testid="vocab-list">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">{labels.word}</th>
            <th className="px-4 py-2 text-left font-semibold">{labels.definition}</th>
            <th className="px-4 py-2 text-right font-semibold w-32"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} data-testid={`vocab-${item.word}`} className="align-top">
                <td className="px-4 py-3 font-medium">
                  {item.word}
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(item.addedAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      placeholder={labels.definitionPlaceholder}
                      data-testid={`edit-def-${item.word}`}
                      className="w-full rounded-md border border-border bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  ) : (
                    <span className={item.definition ? "" : "text-muted"}>
                      {item.definition ?? labels.noDefinition}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(item)}
                        data-testid={`save-vocab-${item.word}`}
                        className="text-xs font-semibold text-brand hover:text-brand-strong"
                      >
                        {labels.save}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs font-semibold text-muted hover:text-foreground"
                      >
                        {labels.cancel}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        data-testid={`edit-vocab-${item.word}`}
                        className="text-xs font-semibold text-brand hover:text-brand-strong"
                      >
                        {labels.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        data-testid={`delete-vocab-${item.word}`}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        {labels.delete}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
