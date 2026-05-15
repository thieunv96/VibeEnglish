import { db } from "@/db";
import { users, onboardingProfiles, userProgress } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export default async function UsersAdminPage() {
  const t = await getTranslations("admin.users");
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: users.role,
      createdAt: users.createdAt,
      level: onboardingProfiles.level,
      streakDays: userProgress.streakDays,
      totalLessons: userProgress.totalLessons,
      lastActive: userProgress.lastActiveDate,
    })
    .from(users)
    .leftJoin(onboardingProfiles, eq(onboardingProfiles.userId, users.id))
    .leftJoin(userProgress, eq(userProgress.userId, users.id))
    .orderBy(desc(users.createdAt));

  return (
    <div className="p-6 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">{t("headerUser")}</th>
              <th className="text-left px-4 py-3">{t("headerLevel")}</th>
              <th className="text-left px-4 py-3">{t("headerStreak")}</th>
              <th className="text-left px-4 py-3">{t("headerLessons")}</th>
              <th className="text-left px-4 py-3">{t("headerActivity")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 flex items-center gap-3">
                  <Avatar className="size-8">
                    {u.image && <AvatarImage src={u.image} />}
                    <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {u.name ?? "—"}
                      {u.role === "admin" && <Badge variant="brand">admin</Badge>}
                    </div>
                    <div className="text-xs text-stone-500">{u.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{u.level ? <Badge variant="outline">{u.level}</Badge> : "—"}</td>
                <td className="px-4 py-3">{u.streakDays ?? 0} 🔥</td>
                <td className="px-4 py-3">{u.totalLessons ?? 0}</td>
                <td className="px-4 py-3 text-xs text-stone-500">{u.lastActive ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
