import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { lessons, reports, contentIntelSuggestions, feedback, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/account-menu";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SidebarNav, type SidebarGroup } from "./sidebar-nav";
import { APP_VERSION } from "@/lib/version";
import { Bell, Search, HelpCircle } from "lucide-react";

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

  const tAdmin = await getTranslations("admin");
  const tGroups = await getTranslations("admin.groups");
  const tItems = await getTranslations("admin.items");
  const tTopbar = await getTranslations("admin.topbar");

  const groups: SidebarGroup[] = [
    {
      id: "overview",
      label: tGroups("overview"),
      icon: "LayoutDashboard",
      items: [{ href: "/admin", label: tItems("dashboard"), icon: "LayoutDashboard" }],
    },
    {
      id: "content",
      label: tGroups("content"),
      icon: "FolderOpen",
      items: [
        {
          href: "/admin/queue",
          label: tItems("queue"),
          icon: "ListChecks",
          badge: queueCount?.c ? { count: Number(queueCount.c), color: "red" } : undefined,
        },
        { href: "/admin/create", label: tItems("create"), icon: "PlusCircle" },
        { href: "/admin/videos", label: tItems("videos"), icon: "Film" },
        { href: "/admin/categories", label: tItems("categories"), icon: "Tag" },
        {
          href: "/admin/intel",
          label: tItems("intel"),
          icon: "Brain",
          badge: intelCount?.c ? { count: Number(intelCount.c), color: "amber" } : undefined,
        },
      ],
    },
    {
      id: "community",
      label: tGroups("community"),
      icon: "Megaphone",
      items: [
        {
          href: "/admin/reports",
          label: tItems("reports"),
          icon: "Flag",
          badge: reportCount?.c ? { count: Number(reportCount.c), color: "red" } : undefined,
        },
        {
          href: "/admin/feedback",
          label: tItems("feedback"),
          icon: "MessageSquare",
          badge: feedbackCount?.c ? { count: Number(feedbackCount.c), color: "amber" } : undefined,
        },
      ],
    },
    {
      id: "analytics",
      label: tGroups("analytics"),
      icon: "BarChart3",
      items: [
        { href: "/admin/analytics", label: tItems("analytics"), icon: "BarChart3" },
        { href: "/admin/users", label: tItems("users"), icon: "Users" },
      ],
    },
    {
      id: "system",
      label: tGroups("system"),
      icon: "Cog",
      items: [
        { href: "/admin/help", label: tItems("help"), icon: "HelpCircle" },
        { href: "/admin/settings", label: tItems("settings"), icon: "Settings" },
      ],
    },
  ];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/auth" });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="w-64 bg-stone-900 text-stone-100 fixed top-0 left-0 h-screen flex flex-col shrink-0 z-30">
        <Link
          href="/admin"
          className="p-4 border-b border-stone-700 flex items-center gap-2.5 hover:bg-stone-800 transition shrink-0"
          title="Vibe Admin home"
        >
          <Logo size="sm" withText={false} />
          <div className="leading-tight">
            <div className="font-bold text-sm">{tAdmin("brand")}</div>
            <div className="text-[10px] text-stone-400">{tAdmin("brandHint")}</div>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav groups={groups} />
        </div>

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

        <div className="px-3 pb-2 text-[10px] text-stone-500 select-none">
          <span className="inline-block">v{APP_VERSION}</span>
          <span className="mx-1.5">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </aside>

      <div className="flex-1 ml-64 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-stone-200">
          <div className="px-6 h-14 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                type="search"
                placeholder={tTopbar("search")}
                className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:bg-white"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LocaleSwitcher variant="light" />
              <Link
                href="/help"
                className="size-9 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition"
                title={tTopbar("help")}
              >
                <HelpCircle className="size-5" />
              </Link>
              <button
                type="button"
                className="size-9 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition relative"
                title={tTopbar("notifications")}
              >
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
