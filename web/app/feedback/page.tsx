import { TopNav } from "@/components/top-nav";
import { FeedbackForm } from "./feedback-form";
import { auth } from "@/auth";

export default async function FeedbackPage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Góp ý cho Vibe English</h1>
          <p className="text-sm text-stone-500 mt-1">
            Ý kiến của bạn giúp chúng tôi tốt hơn mỗi ngày 💜
          </p>
        </header>
        <FeedbackForm defaultEmail={session?.user?.email ?? ""} />
      </main>
    </div>
  );
}
