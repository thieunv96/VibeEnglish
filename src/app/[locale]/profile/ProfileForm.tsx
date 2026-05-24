"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  email: string;
  initial: {
    name: string | null;
    birthYear: number | null;
    country: string | null;
  };
  labels: {
    email: string;
    name: string;
    birthYear: string;
    country: string;
    save: string;
    saved: string;
  };
}

export function ProfileForm({ email, initial, labels }: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [birthYear, setBirthYear] = useState(initial.birthYear ? String(initial.birthYear) : "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          birthYear: birthYear.trim() ? Number(birthYear) : null,
          country: country.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Save failed");
        return;
      }
      toast.success(labels.saved);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-lg" data-testid="profile-form">
      <Field label={labels.email}>
        <input value={email} readOnly className="w-full rounded-md border border-border bg-surface px-3 py-2 text-muted" />
      </Field>
      <Field label={labels.name}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="profile-name"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </Field>
      <Field label={labels.birthYear}>
        <input
          type="number"
          min={1900}
          max={2030}
          inputMode="numeric"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          data-testid="profile-birth-year"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </Field>
      <Field label={labels.country}>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          data-testid="profile-country"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          data-testid="profile-submit"
          className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5 disabled:opacity-50"
        >
          {isPending ? "…" : labels.save}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
