import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean; email?: string | null } | undefined;

  if (!user) redirect("/auth/login");
  if (!user.isAdmin) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <h1 className="text-3xl font-bold" data-testid="page-title">403 — Admins only</h1>
        <p className="mt-3 text-muted">
          You’re signed in as <code className="font-mono">{user.email}</code> but this account is not an admin.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-md bg-brand text-white px-5 py-2 font-semibold">
          ← Back home
        </Link>
      </Container>
    );
  }

  return (
    <div className="bg-surface min-h-screen">
      <Container size="wide" className="py-8">
        <nav className="mb-6 flex flex-wrap items-center gap-4 border-b border-border pb-4" aria-label="Admin">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">Admin</span>
          <Link href="/admin" className="text-sm font-medium hover:text-brand">Dashboard</Link>
          <Link href="/admin/lessons" className="text-sm font-medium hover:text-brand">Lessons</Link>
          <Link href="/admin/exercises" className="text-sm font-medium hover:text-brand">Exercises</Link>
          <Link href="/admin/import" className="text-sm font-medium hover:text-brand">Import</Link>
          <Link href="/admin/analytics" className="text-sm font-medium hover:text-brand">Analytics</Link>
          <span className="ml-auto text-xs text-muted">Signed in as {user.email}</span>
        </nav>
        {children}
      </Container>
    </div>
  );
}
