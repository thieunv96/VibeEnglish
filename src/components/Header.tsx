import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchBar } from "./SearchBar";
import { MobileNav } from "./MobileNav";
import { AvatarMenu } from "./AvatarMenu";
import { PrimaryNav } from "./PrimaryNav";
import { Link } from "@/i18n/navigation";

export async function Header() {
  const t = await getTranslations("nav");
  const session = await auth();
  const sessionUser = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  const isAdmin = Boolean(sessionUser?.isAdmin);
  const isAuthed = Boolean(sessionUser?.id);

  let displayName = "";
  let displayEmail = "";
  let avatarUrl: string | null = null;
  if (isAuthed) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser!.id! },
      select: { name: true, email: true, avatarUrl: true },
    });
    if (user) {
      displayName = user.name || user.email;
      displayEmail = user.email;
      avatarUrl = user.avatarUrl;
    }
  }

  const learnerLinks = [
    { href: "/lessons" as const, label: t("lessons") },
    { href: "/practice" as const, label: t("practice") },
    { href: "/sample-test" as const, label: t("sampleTest") },
    { href: "/learn-from-youtube" as const, label: t("youtube") },
  ];
  const adminLinks = [
    { href: "/admin" as const, label: t("adminHome") },
    { href: "/admin/lessons" as const, label: t("lessons") },
    { href: "/admin/exercises" as const, label: t("exercises") },
    { href: "/admin/analytics" as const, label: t("analytics") },
  ];
  const links = isAdmin ? adminLinks : learnerLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container size="wide">
        <div className="flex h-16 items-center gap-3 sm:gap-4">
          {/* Mobile hamburger */}
          <MobileNav
            items={links}
            labels={{ open: t("mobile.open"), close: t("mobile.close"), menu: t("mobile.menu") }}
          />

          {/* Left cluster: logo + (desktop) primary nav */}
          <div className="flex items-center gap-6">
            <Logo />
            <PrimaryNav items={links} />
          </div>

          {/* Center: search */}
          <SearchBar placeholder={t("searchPlaceholder")} openLabel={t("mobile.search")} />

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher />
            {isAuthed ? (
              <AvatarMenu
                name={displayName}
                email={displayEmail}
                avatarUrl={avatarUrl}
                items={
                  isAdmin
                    ? [
                        { href: "/admin", label: t("adminHome"), testId: "avatar-menu-admin" },
                        { href: "/admin/lessons", label: t("lessons"), testId: "avatar-menu-admin-lessons" },
                        { href: "/admin/analytics", label: t("analytics"), testId: "avatar-menu-admin-analytics" },
                      ]
                    : [
                        { href: "/profile", label: t("menu.profile"), testId: "avatar-menu-profile" },
                        { href: "/vocab", label: t("menu.vocab"), testId: "avatar-menu-vocab" },
                        { href: "/history", label: t("menu.history"), testId: "avatar-menu-history" },
                      ]
                }
                signOutLabel={t("menu.signOut")}
              />
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
