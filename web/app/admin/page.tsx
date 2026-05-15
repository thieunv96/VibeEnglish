import { db } from "@/db";
import { users, lessons, reports, contentIntelSuggestions } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Users as UsersIcon, Clock, Send, AlertTriangle } from "lucide-react";
import { LESSON_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminDashboard() {
  const [userCount] = await db.select({ c: sql<number>`count(*)` }).from(users);
  const [queueCount] = await db.select({ c: sql<number>`count(*)` }).from(lessons).where(eq(lessons.status, "queued"));
  const [publishedCount] = await db.select({ c: sql<number>`count(*)` }).from(lessons).where(eq(lessons.status, "published"));
  const [openReports] = await db.select({ c: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "open"));

  const recentQueue = await db
    .select()
    .from(lessons)
    .where(eq(lessons.status, "queued"))
    .orderBy(desc(lessons.createdAt))
    .limit(5);

  const recentIntel = await db
    .select()
    .from(contentIntelSuggestions)
    .where(eq(contentIntelSuggestions.status, "new"))
    .orderBy(desc(contentIntelSuggestions.createdAt))
    .limit(5);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<UsersIcon className="size-5" />} label="Tổng users" value={String(userCount.c)} color="brand" />
        <MetricCard icon={<Clock className="size-5" />} label="Bài chờ duyệt" value={String(queueCount.c)} color="amber" />
        <MetricCard icon={<Send className="size-5" />} label="Đã publish" value={String(publishedCount.c)} color="emerald" />
        <MetricCard icon={<AlertTriangle className="size-5" />} label="Reports mở" value={String(openReports.c)} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Bài chờ duyệt gần nhất" href="/admin/queue">
          {recentQueue.length === 0 ? (
            <p className="text-sm text-stone-500">Không có bài nào đang chờ.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentQueue.map((l) => {
                const t = LESSON_TYPES.find((x) => x.id === l.type)!;
                return (
                  <li key={l.id} className="py-2.5 flex items-center gap-3">
                    <span className="text-lg">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.title}</div>
                      <div className="text-xs text-stone-500">{l.level} · {t.label}</div>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="AI suggestions mới nhất" href="/admin/intel">
          {recentIntel.length === 0 ? (
            <p className="text-sm text-stone-500">AI chưa có gợi ý mới.</p>
          ) : (
            <ul className="space-y-3">
              {recentIntel.map((s) => (
                <li key={s.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={s.priority === "high" ? "danger" : s.priority === "medium" ? "warning" : "default"}>
                      {s.priority}
                    </Badge>
                    <span className="text-xs text-stone-500">{s.level} · {s.skill}</span>
                  </div>
                  <div className="font-medium text-sm">{s.title}</div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{s.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: "brand" | "amber" | "emerald" | "red" }) {
  const colorClass = {
    brand: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  }[color];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className={`inline-flex size-9 rounded-lg ${colorClass} items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">{title}</h3>
        <Link href={href} className="text-xs text-brand-600 hover:underline">Xem tất cả →</Link>
      </div>
      {children}
    </div>
  );
}
