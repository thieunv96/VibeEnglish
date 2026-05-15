import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ArrowLeft } from "lucide-react";

export default async function TermsPage() {
  const t = await getTranslations("terms");
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/auth" className="flex items-center gap-2">
            <Logo size="sm" withSlogan />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher variant="light" />
            <Link href="/auth" className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1">
              <ArrowLeft className="size-4" /> {t("backToAuth")}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-sm text-stone-500">{t("lastUpdated", { date: "2026-05-15" })}</p>
        </header>

        <Section title={t("s1Title")} body={t("s1Body")} />
        <Section title={t("s2Title")} body={t("s2Body")} />
        <Section title={t("s3Title")} body={t("s3Body")} />
        <Section title={t("s4Title")} body={t("s4Body")} />
        <Section title={t("s5Title")} body={t("s5Body")} />
        <Section title={t("s6Title")} body={t("s6Body")} />
        <Section title={t("s7Title")} body={t("s7Body")} />

        <div className="text-sm text-stone-500 pt-4 border-t border-stone-200">
          {t("contact")}{" "}
          <a href="mailto:contact@vibeenglish.local" className="text-brand-600 hover:underline">
            contact@vibeenglish.local
          </a>
        </div>
      </main>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="prose prose-stone max-w-none">
      <h2 className="text-xl font-bold text-stone-900 mb-3">{title}</h2>
      <p className="whitespace-pre-line text-stone-700 leading-relaxed">{body}</p>
    </section>
  );
}
