import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const tBrand = await getTranslations("brand");

  return (
    <Container size="narrow" className="py-16">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <Image src="/brand/logo.png" alt="VibeEnglish" width={56} height={56} className="rounded-xl" priority />
          <p className="mt-2 text-sm font-medium text-brand">{tBrand("tagline")}</p>
        </div>
        <h1 className="text-2xl font-bold text-center" data-testid="page-title">{t("loginTitle")}</h1>
        <p className="mt-1 text-sm text-muted text-center">{t("loginSub")}</p>

        <LoginForm
          labels={{
            email: t("email"),
            password: t("password"),
            submit: t("loginBtn"),
            invalid: t("invalid"),
          }}
        />

        <p className="mt-6 text-sm text-muted">
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="text-brand font-semibold hover:text-brand-strong">
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
