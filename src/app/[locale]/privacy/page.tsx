import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container size="narrow" className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-6" data-testid="page-title">Privacy Policy</h1>
      <div className="space-y-4 text-foreground">
        <p>This is a local, educational clone of vibeenglish.com. It runs entirely on your machine and does not transmit personal data to any third-party service.</p>
        <h2 className="text-xl font-semibold mt-6">What we store</h2>
        <p>If you create an account, we store your email, a hashed password, optional display name, and your learning progress (lesson accuracy, saved vocabulary, exercise scores) in a local SQLite database.</p>
        <h2 className="text-xl font-semibold mt-6">What we don't do</h2>
        <p>We don't run analytics, ads, or trackers. We don't share data with anyone. There is no third-party service involved.</p>
        <h2 className="text-xl font-semibold mt-6">Your data, your control</h2>
        <p>You can delete saved vocabulary at any time from your dashboard. To wipe everything, remove the local <code>dev.db</code> file.</p>
      </div>
    </Container>
  );
}
