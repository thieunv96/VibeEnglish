"use client";

import { useState } from "react";

interface VocabRow {
  id: string;
  word: string;
  addedAt: string;
  sourceLessonSlug?: string | null;
}

interface Props {
  initialItems: VocabRow[];
  labelDelete: string;
}

export function VocabList({ initialItems, labelDelete }: Props) {
  const [items, setItems] = useState(initialItems);

  async function remove(id: string) {
    const before = items;
    setItems(items.filter((i) => i.id !== id));
    const res = await fetch(`/api/vocab?id=${id}`, { method: "DELETE" });
    if (!res.ok) setItems(before);
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-white" data-testid="vocab-list">
      {items.map((item) => (
        <li
          key={item.id}
          data-testid={`vocab-${item.word}`}
          className="flex items-center justify-between px-4 py-3"
        >
          <div>
            <span className="font-medium">{item.word}</span>
            <span className="ml-3 text-xs text-muted">
              {new Date(item.addedAt).toLocaleDateString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => remove(item.id)}
            data-testid={`delete-vocab-${item.word}`}
            className="text-xs text-red-600 hover:text-red-800 font-semibold"
          >
            {labelDelete}
          </button>
        </li>
      ))}
    </ul>
  );
}
