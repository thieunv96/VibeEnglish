import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container size="narrow" className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-6" data-testid="page-title">Terms of Use</h1>
      <div className="space-y-4 text-foreground">
        <p>This local clone is provided for personal, educational and demonstration use only.</p>
        <h2 className="text-xl font-semibold mt-6">Content</h2>
        <p>Lesson and exercise content shipped with this clone is original sample material or in the public domain (e.g., classic Aesop fables, retold for clarity). Audio is generated on demand in your browser using the Web Speech API.</p>
        <h2 className="text-xl font-semibold mt-6">No warranty</h2>
        <p>The platform is provided “as is” without warranty of any kind. Use it to learn, experiment and have fun.</p>
        <h2 className="text-xl font-semibold mt-6">Trademarks</h2>
        <p>“VibeEnglish” is referenced here for clone purposes. Trademarks belong to their respective owners.</p>
      </div>
    </Container>
  );
}
