import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { Link } from "@/i18n/navigation";
import { AdminNav } from "@/components/AdminNav";

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
        <AdminNav
          email={user.email}
          items={[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/lessons", label: "Lessons" },
            { href: "/admin/exercises", label: "Exercises" },
            { href: "/admin/import", label: "Import" },
            { href: "/admin/analytics", label: "Analytics" },
          ]}
        />
        {children}
      </Container>
    </div>
  );
}
