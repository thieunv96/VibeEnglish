"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

interface Props {
  labels: {
    name: string;
    email: string;
    password: string;
    submit: string;
    exists: string;
    weak: string;
  };
}

export function RegisterForm({ labels }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "");
    setError(null);

    if (password.length < 6) {
      setError(labels.weak);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (res.status === 409) {
        setError(labels.exists);
        return;
      }
      if (!res.ok) {
        setError("Could not register.");
        return;
      }
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Account created but login failed. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" data-testid="register-form">
      <label className="block">
        <span className="text-sm font-medium">{labels.name}</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          data-testid="register-name"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{labels.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          data-testid="register-email"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{labels.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          data-testid="register-password"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      {error && (
        <p className="text-sm text-red-600" data-testid="register-error">{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        data-testid="register-submit"
        className="w-full rounded-md bg-brand hover:bg-brand-strong text-white font-semibold py-2.5 disabled:opacity-50"
      >
        {labels.submit}
      </button>
    </form>
  );
}
