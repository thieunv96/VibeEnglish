import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, Flame, HelpCircle } from "lucide-react";
import { auth, signOut } from "@/auth";
import { initials } from "@/lib/utils";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function TopNav({ active }: { active?: "home" | "profile" }) {
  const session = await auth();
  if (!session?.user) return null;
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id))
    .limit(1);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden md:block text-xs text-stone-400 ml-1">Tự do học, tự tin nói</span>
        </Link>

        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition ${
              active === "home" ? "text-brand-700 bg-brand-50" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Thư viện
          </Link>
          <Link
            href="/profile"
            className={`px-3 py-2 rounded-lg transition ${
              active === "profile" ? "text-brand-700 bg-brand-50" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Hồ sơ
          </Link>
          {session.user.role === "admin" && (
            <Link href="/admin" className="px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-100">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/profile"
            className="hidden sm:flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium"
            title="Streak hiện tại"
          >
            <Flame className="size-4" />
            {progress?.streakDays ?? 0}
          </Link>
          <Link href="/help" className="text-stone-400 hover:text-stone-600" title="Trợ giúp">
            <HelpCircle className="size-5" />
          </Link>
          <button className="text-stone-400 hover:text-stone-600 relative" title="Thông báo">
            <Bell className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-red-500 rounded-full" />
          </button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth" });
            }}
            className="contents"
          >
            <button className="flex items-center gap-2" title="Hồ sơ">
              <Avatar className="size-9">
                {session.user.image && <AvatarImage src={session.user.image} />}
                <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
              </Avatar>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return <Badge variant="brand">{level}</Badge>;
}
