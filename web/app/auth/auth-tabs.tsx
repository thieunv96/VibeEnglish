"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction } from "./actions";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

  // Captcha state
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  useEffect(() => {
    setCaptcha({ a: rand(1, 9), b: rand(1, 9) });
  }, []);
  const refreshCaptcha = () => setCaptcha({ a: rand(1, 9), b: rand(1, 9) });

  // Year of birth options (5 years old min, 1900 min)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: currentYear - 1900 - 4 }, (_, i) => currentYear - 5 - i),
    [currentYear]
  );

  const translateError = (key: string) => {
    try {
      return t(`errors.${key}` as const);
    } catch {
      return key;
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (mode === "register") {
      formData.set("captchaQuestion", `${captcha.a}+${captcha.b}`);
    }
    startTransition(async () => {
      const result = mode === "login" ? await loginAction(formData) : await registerAction(formData);
      if (result.ok) {
        setSuccess(true);
        const dest = mode === "register" ? "/onboarding" : nextPath || "/";
        router.replace(dest);
        router.refresh();
      } else {
        setError(translateError(result.error));
        if (mode === "register") refreshCaptcha();
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
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
        </div>

        {mode === "register" && (
          <>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="yearOfBirth">{t("yearOfBirth")}</Label>
                <select
                  id="yearOfBirth"
                  name="yearOfBirth"
                  required
                  defaultValue=""
                  className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <option value="" disabled>{t("selectPlaceholder")}</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">{t("gender")}</Label>
                <select
                  id="gender"
                  name="gender"
                  required
                  defaultValue=""
                  className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <option value="" disabled>{t("selectPlaceholder")}</option>
                  <option value="male">{t("genderMale")}</option>
                  <option value="female">{t("genderFemale")}</option>
                  <option value="other">{t("genderOther")}</option>
                </select>
              </div>
            </div>
          </>
        )}

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

        {mode === "register" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="captchaAnswer">{t("captchaLabel")}</Label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 h-10 rounded-lg bg-stone-100 border border-stone-200 font-mono font-semibold tabular-nums select-none">
                  {captcha.a} + {captcha.b} = ?
                </span>
                <Input
                  id="captchaAnswer"
                  name="captchaAnswer"
                  type="text"
                  inputMode="numeric"
                  required
                  className="w-24"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-stone-400 hover:text-stone-600"
                  title={t("captchaRefresh")}
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}

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
