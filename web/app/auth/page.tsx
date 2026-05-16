import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AuthTabs } from "./auth-tabs";
import { Sparkles, Brain, BarChart3, Zap } from "lucide-react";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: "login" | "register" }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const sp = await searchParams;
  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 relative">
      {/* Top locale switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher variant="light" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo + slogan on top */}
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size="lg" withSlogan />
            <p className="mt-4 text-sm text-ink-500 max-w-sm">{t("brandingDesc")}</p>
          </div>

          {/* Auth form card */}
          <div className="w-full rounded-lg border border-ink-200 bg-white shadow-card p-6 sm:p-8">
            <AuthTabs defaultMode={sp.mode === "register" ? "register" : "login"} nextPath={sp.next} />
          </div>

          {/* Feature list below the form (compact) */}
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-ink-600 max-w-md w-full">
            {[
              { icon: Sparkles, label: t("feature1") },
              { icon: Brain, label: t("feature2") },
              { icon: BarChart3, label: t("feature3") },
              { icon: Zap, label: t("feature4") },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <span className="size-7 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                  <Icon className="size-3.5" />
                </span>
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-400">
        © Vibe English · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
