import { getTranslations } from "next-intl/server";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  const tCat = await getTranslations("categories");
  const tSkill = await getTranslations("skills");
  const tExam = await getTranslations("exams");

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <Container size="wide" className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <Logo withTagline />
            <p className="mt-3 text-sm text-muted max-w-xs">{t("tagline")}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("popularLessons")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/lessons/short-stories" className="hover:text-brand">{tCat("short-stories")}</Link></li>
              <li><Link href="/lessons/conversations" className="hover:text-brand">{tCat("conversations")}</Link></li>
              <li><Link href="/lessons/ted-ed" className="hover:text-brand">{tCat("ted-ed")}</Link></li>
              <li><Link href="/lessons/youtube-random" className="hover:text-brand">{tCat("youtube-random")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("practice")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/practice/grammar" className="hover:text-brand">{tSkill("grammar")}</Link></li>
              <li><Link href="/practice/vocabulary" className="hover:text-brand">{tSkill("vocabulary")}</Link></li>
              <li><Link href="/practice/listening" className="hover:text-brand">{tSkill("listening")}</Link></li>
              <li><Link href="/practice/reading" className="hover:text-brand">{tSkill("reading")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("testPrep")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/test-prep/toeic" className="hover:text-brand">{tExam("toeic")}</Link></li>
              <li><Link href="/test-prep/toefl" className="hover:text-brand">{tExam("toefl")}</Link></li>
              <li><Link href="/test-prep/ielts" className="hover:text-brand">{tExam("ielts")}</Link></li>
              <li><Link href="/test-prep/oet" className="hover:text-brand">{tExam("oet")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("resources")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/about" className="hover:text-brand">About</Link></li>
              <li><Link href="/faq" className="hover:text-brand">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-brand">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-brand">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-sm text-muted">
          {t("copyright")}
        </div>
      </Container>
    </footer>
  );
}
