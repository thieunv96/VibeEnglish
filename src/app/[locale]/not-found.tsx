import { Link } from "@/i18n/navigation";
import { Container } from "@/components/Container";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  // next-intl's `getTranslations` works without setRequestLocale in not-found
  // because the locale is available from middleware via the [locale] segment.
  const t = await getTranslations("notFound");
  return (
    <Container size="narrow" className="py-24 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-foreground">404</h1>
      <p className="mt-3 text-lg text-muted">{t("body")}</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5"
      >
        ← {t("back")}
      </Link>
    </Container>
  );
}
