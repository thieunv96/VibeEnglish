"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

interface Props {
  labels: {
    name: string;
    email: string;
    password: string;
    birthYear: string;
    submit: string;
    exists: string;
    weak: string;
  };
}

export function RegisterForm({ labels }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "");
    const birthYearRaw = String(fd.get("birthYear") ?? "").trim();
    const birthYear = birthYearRaw ? Number(birthYearRaw) : undefined;

    if (password.length < 6) {
      toast.error(labels.weak);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, birthYear }),
      });
      if (res.status === 409) {
        toast.error(labels.exists);
        return;
      }
      if (!res.ok) {
        toast.error("Could not register.");
        return;
      }
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        toast.error("Account created but login failed. Please try again.");
        return;
      }
      router.push("/profile");
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
      <label className="block">
        <span className="text-sm font-medium">{labels.birthYear}</span>
        <input
          name="birthYear"
          type="number"
          min={1900}
          max={2030}
          inputMode="numeric"
          autoComplete="bday-year"
          data-testid="register-birth-year"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
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
