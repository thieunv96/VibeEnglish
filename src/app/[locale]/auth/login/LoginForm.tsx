"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { loginAction } from "./actions";

interface Props {
  labels: {
    email: string;
    password: string;
    submit: string;
    invalid: string;
  };
  errorParam?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="login-submit"
      className="w-full rounded-md bg-brand hover:bg-brand-strong text-white font-semibold py-2.5 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function LoginForm({ labels, errorParam }: Props) {
  useEffect(() => {
    if (errorParam === "invalid") toast.error(labels.invalid);
  }, [errorParam, labels.invalid]);

  return (
    <form action={loginAction} className="mt-6 space-y-4" data-testid="login-form">
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
      <SubmitButton label={labels.submit} />
    </form>
  );
}
