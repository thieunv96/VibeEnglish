"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

interface Props {
  labels: {
    email: string;
    password: string;
    submit: string;
    invalid: string;
  };
}

export function LoginForm({ labels }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(labels.invalid);
        return;
      }
      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" data-testid="login-form">
      <label className="block">
        <span className="text-sm font-medium">{labels.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          data-testid="login-email"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{labels.password}</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          data-testid="login-password"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        data-testid="login-submit"
        className="w-full rounded-md bg-brand hover:bg-brand-strong text-white font-semibold py-2.5 disabled:opacity-50"
      >
        {labels.submit}
      </button>
    </form>
  );
}
