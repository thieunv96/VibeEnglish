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

  const nav: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: { count: number; color: "red" | "amber" };
  }[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/queue",
      label: "Lesson Queue",
      icon: ListChecks,
      badge: queueCount?.c ? { count: Number(queueCount.c), color: "red" } : undefined,
    },
    { href: "/admin/create", label: "Tạo bài học", icon: PlusCircle },
    { href: "/admin/videos", label: "Video Manager", icon: Film },
    {
      href: "/admin/intel",
      label: "Content Intelligence",
      icon: Brain,
      badge: intelCount?.c ? { count: Number(intelCount.c), color: "amber" } : undefined,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: Flag,
      badge: reportCount?.c ? { count: Number(reportCount.c), color: "red" } : undefined,
    },
    {
      href: "/admin/feedback",
      label: "User Feedback",
      icon: MessageSquare,
      badge: feedbackCount?.c ? { count: Number(feedbackCount.c), color: "amber" } : undefined,
    },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/help", label: "Help Content", icon: HelpCircle },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/ai-settings", label: "AI Settings", icon: Settings },
  ];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth" });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="w-64 bg-stone-900 text-stone-100 fixed top-0 left-0 h-screen flex flex-col shrink-0 z-30">
        {/* Logo: click → /admin */}
        <Link
          href="/admin"
          className="p-4 border-b border-stone-700 flex items-center gap-2.5 hover:bg-stone-800 transition shrink-0"
          title="Vibe Admin home"
        >
          <Logo size="sm" withText={false} className="[&_div]:bg-white/15" />
          <div className="leading-tight">
            <div className="font-bold text-sm">Vibe Admin</div>
            <div className="text-[10px] text-stone-400">Learn freely, speak confidently</div>
          </div>
        </Link>

        {/* Nav items — scrolls within the sidebar only if list overflows */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 text-sm scrollbar-thin">
          {nav.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-stone-800 transition relative"
            >
              <Icon className="size-4 text-stone-400" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    badge.color === "red" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {badge.count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Account / AccountMenu at the bottom of the sidebar */}
        <div className="border-t border-stone-700 p-3 flex items-center gap-3 shrink-0">
          <AccountMenu
            name={user?.name ?? session.user.email}
            email={session.user.email}
            avatarSrc={user?.avatarData ?? user?.image ?? null}
            locale={(user?.locale ?? "vi") as "vi" | "en"}
            isAdmin
            signOutAction={handleSignOut}
          />
          <div className="min-w-0">
            <div className="font-semibold text-xs truncate">{user?.name ?? session.user.email}</div>
            <div className="text-[10px] text-stone-400 truncate">{session.user.email}</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-w-0 overflow-x-auto">{children}</main>
    </div>
  );
}
