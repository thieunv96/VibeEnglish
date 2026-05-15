import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { lessons, reports, contentIntelSuggestions, feedback, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { signOut } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/account-menu";
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Film,
  Brain,
  Flag,
  MessageSquare,
  BarChart3,
  HelpCircle,
  Users,
  Settings,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  if (session.user.role !== "admin") redirect("/");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

  const [queueCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(lessons)
    .where(eq(lessons.status, "queued"));
  const [reportCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.status, "open"));
  const [intelCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(contentIntelSuggestions)
    .where(eq(contentIntelSuggestions.status, "new"));
  const [feedbackCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(feedback)
    .where(eq(feedback.status, "new"));

  const nav: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: { count: number; color: "red" | "amber" } }[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/queue", label: "Queue", icon: ListChecks, badge: queueCount?.c ? { count: Number(queueCount.c), color: "red" } : undefined },
    { href: "/admin/create", label: "Tạo bài học", icon: PlusCircle },
    { href: "/admin/videos", label: "Videos", icon: Film },
    { href: "/admin/intel", label: "Intel", icon: Brain, badge: intelCount?.c ? { count: Number(intelCount.c), color: "amber" } : undefined },
    { href: "/admin/reports", label: "Reports", icon: Flag, badge: reportCount?.c ? { count: Number(reportCount.c), color: "red" } : undefined },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, badge: feedbackCount?.c ? { count: Number(feedbackCount.c), color: "amber" } : undefined },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/help", label: "Help CMS", icon: HelpCircle },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/ai-settings", label: "AI Settings", icon: Settings },
  ];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth" });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0" title="Trang chủ admin">
            <Logo size="sm" withText={false} />
            <div>
              <div className="font-bold text-sm leading-none">Vibe Admin</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Quản lý nội dung & người dùng</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 ml-2 overflow-x-auto scrollbar-thin text-sm flex-1">
            {nav.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition relative whitespace-nowrap"
              >
                <Icon className="size-4 text-stone-400 group-hover:text-stone-600" />
                <span>{label}</span>
                {badge && (
                  <span
                    className={`text-[10px] px-1.5 py-px rounded-full font-medium ${
                      badge.color === "red" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    {badge.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <AccountMenu
              name={user?.name ?? session.user.email}
              email={session.user.email}
              avatarSrc={user?.avatarData ?? user?.image ?? null}
              locale={(user?.locale ?? "vi") as "vi" | "en"}
              isAdmin
              signOutAction={handleSignOut}
            />
          </div>
        </div>

        {/* Mobile nav: horizontal scroll row beneath the title row */}
        <nav className="md:hidden border-t border-stone-100 flex items-center gap-0.5 px-3 py-2 overflow-x-auto scrollbar-thin text-xs">
          {nav.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-stone-600 hover:bg-stone-100 transition whitespace-nowrap"
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
              {badge && (
                <span
                  className={`text-[9px] px-1 rounded-full font-medium ${
                    badge.color === "red" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {badge.count}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto">{children}</main>
    </div>
  );
}
