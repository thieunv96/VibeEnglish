import { auth, signOut } from "@/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

async function SignOutButton({ label, locale }: { label: string; locale: string }) {
  // Default-locale (en) is unprefixed because of `localePrefix: "as-needed"`,
  // so send those users back to "/" and prefixed locales to "/<locale>".
  const redirectTo = locale === routing.defaultLocale ? "/" : `/${locale}`;
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo });
      }}
    >
      <button
        type="submit"
        className="text-sm font-medium text-foreground hover:text-brand transition-colors"
      >
        {label}
      </button>
    </form>
  );
}

export async function Header() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium"
            aria-label="Primary"
          >
            <Link
              href="/lessons"
              className="text-foreground hover:text-brand transition-colors"
            >
              {t("lessons")}
            </Link>
            <Link
              href="/practice"
              className="text-foreground hover:text-brand transition-colors"
            >
              {t("practice")}
            </Link>
            <Link
              href="/learn-from-youtube"
              className="text-foreground hover:text-brand transition-colors"
            >
              {t("youtube")}
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:inline text-sm font-medium text-foreground hover:text-brand transition-colors"
                >
                  {t("dashboard")}
                </Link>
                <SignOutButton label={t("signOut")} locale={locale} />
              </>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                {t("signIn")}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
