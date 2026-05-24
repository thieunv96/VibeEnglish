import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/Container";
import { VocabList } from "@/components/VocabList";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function VocabPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) redirect("/auth/login");
  if (u.isAdmin) redirect("/admin");

  const vocab = await prisma.vocabItem.findMany({
    where: { userId: u.id },
    orderBy: { addedAt: "desc" },
  });

  const t = await getTranslations("vocabPage");
  const tDash = await getTranslations("dashboard");

  return (
    <Container size="wide" className="py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">{t("title")}</h1>
        <p className="mt-1 text-muted text-sm">{t("sub", { count: vocab.length })}</p>
      </header>

      {vocab.length === 0 ? (
        <p className="text-muted text-sm">{tDash("noVocab")}</p>
      ) : (
        <VocabList
          initialItems={vocab.map((v) => ({
            id: v.id,
            word: v.word,
            sourceLessonSlug: v.sourceLessonSlug,
            addedAt: v.addedAt.toISOString(),
          }))}
          labelDelete={tDash("deleteVocab")}
        />
      )}
    </Container>
  );
}
