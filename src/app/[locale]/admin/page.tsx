import { Link } from "@/i18n/navigation";
import { categoryStats, skillStats } from "@/lib/content";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  const [cats, sks, lessonCount, exerciseCount, userCount] = await Promise.all([
    categoryStats(),
    skillStats(),
    prisma.lesson.count(),
    prisma.exercise.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
        <p className="mt-1 text-muted">Manage lessons, exercises, and users.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat title="Total lessons" value={lessonCount} />
        <Stat title="Total exercises" value={exerciseCount} />
        <Stat title="Total users" value={userCount} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Lessons by category" href="/admin/lessons" cta="Manage lessons →">
          <ul className="divide-y divide-border">
            {cats.map((c) => (
              <li key={c.slug} className="flex justify-between py-2 text-sm">
                <span className="capitalize">{c.slug.replace(/-/g, " ")}</span>
                <span className="font-semibold text-brand">{c.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Exercises by skill" href="/admin/exercises" cta="Manage exercises →">
          <ul className="divide-y divide-border">
            {sks.map((s) => (
              <li key={s.slug} className="flex justify-between py-2 text-sm">
                <span className="capitalize">{s.slug.replace(/-/g, " ")}</span>
                <span className="font-semibold text-brand">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="text-sm text-muted">{title}</div>
      <div className="mt-1 text-3xl font-extrabold text-brand">{value}</div>
    </div>
  );
}

function Card({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-brand hover:text-brand-strong">{cta}</Link>
      </div>
      {children}
    </div>
  );
}
