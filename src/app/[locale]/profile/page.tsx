import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/Container";
import { ProfileForm } from "./ProfileForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) redirect("/auth/login");
  if (u.isAdmin) redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { id: u.id },
    select: { email: true, name: true, birthYear: true, country: true, locale: true },
  });
  if (!user) redirect("/auth/login");

  const t = await getTranslations("profile");

  return (
    <Container size="narrow" className="py-12">
      <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
      <p className="mt-1 text-muted text-sm">{t("sub")}</p>
      <ProfileForm
        email={user.email}
        initial={{
          name: user.name,
          birthYear: user.birthYear,
          country: user.country,
        }}
        labels={{
          email: t("email"),
          name: t("name"),
          birthYear: t("birthYear"),
          country: t("country"),
          save: t("save"),
          saved: t("saved"),
        }}
      />
    </Container>
  );
}
