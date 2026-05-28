import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error } = await searchParams;
  const t = await getTranslations("auth");
  const tBrand = await getTranslations("brand");

  return (
    <Container size="narrow" className="py-16">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <span
            aria-hidden
            className="grid place-items-center h-14 w-14 rounded-xl bg-brand text-white font-extrabold text-xl shadow-sm"
          >
            VE
          </span>
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
          errorParam={error}
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
