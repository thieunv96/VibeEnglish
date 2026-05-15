"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction } from "./actions";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function AuthTabs({
  defaultMode,
  nextPath,
}: {
  defaultMode: "login" | "register";
  nextPath?: string;
}) {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = mode === "login" ? await loginAction(formData) : await registerAction(formData);
      if (result.ok) {
        setSuccess(true);
        const dest = mode === "register" ? "/onboarding" : nextPath || "/";
        router.replace(dest);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold">
          {mode === "login" ? t("loginTitle") : t("registerTitle")}
        </h2>
        <p className="text-sm text-stone-500">
          {mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-medium">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "h-9 rounded-lg transition",
              mode === m ? "bg-white shadow-sm text-brand-700" : "text-stone-500 hover:text-stone-900"
            )}
          >
            {m === "login" ? t("login") : t("register")}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input id="firstName" name="firstName" required autoComplete="given-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input id="lastName" name="lastName" required autoComplete="family-name" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">{t("password")}</Label>
            {mode === "login" && (
              <button type="button" className="text-xs text-brand-600 hover:underline">
                {t("forgotPassword")}
              </button>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 6 : 1}
            placeholder={mode === "register" ? t("passwordHintRegister") : t("passwordHintLogin")}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {t("successRedirecting")}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin size-4" />}
          {mode === "login" ? t("login") : t("createAccount")}
        </Button>
      </form>

      <p className="text-center text-xs text-stone-400">
        {t("terms", { action: mode === "login" ? t("login").toLowerCase() : t("register").toLowerCase() })}
      </p>
    </div>
  );
}
