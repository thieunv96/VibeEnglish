"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { isStrongPassword } from "@/lib/password-policy";

interface Props {
  labels: {
    name: string;
    email: string;
    password: string;
    birthYear: string;
    submit: string;
    exists: string;
    weak: string;
    /** Toast shown when the post-signup claim call fails unexpectedly. */
    claimFailed: string;
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

    if (!isStrongPassword(password)) {
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

      // Post-signup claim: attempt to persist any pending sample-test / CEFR-test
      // result stored in the HttpOnly cookie. The registration already succeeded at
      // this point — claim failure MUST NOT block the redirect.
      try {
        const claimRes = await fetch("/api/sample-test/claim", { method: "POST" });
        if (claimRes.ok) {
          const { testType } = (await claimRes.json()) as { testType?: string };
          if (testType === "cefr") {
            router.push("/sample-test/cefr/results");
          } else {
            // testType === "sample" or any future test type falls back to sample results
            router.push("/sample-test/results");
          }
        } else if (claimRes.status === 400) {
          // no_session | session_expired | invalid_session → silent redirect to dashboard
          // (registration succeeded; only the claim was a no-op)
          router.push("/dashboard");
        } else {
          toast.error(labels.claimFailed);
          router.push("/");
        }
      } catch {
        // Network failure — registration is still a success; redirect to home.
        router.push("/");
      }

      router.refresh();
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} className="mt-6 space-y-4" data-testid="register-form">
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
          minLength={8}
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
