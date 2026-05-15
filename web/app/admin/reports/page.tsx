import { db } from "@/db";
import { reports, lessons, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY: Record<string, string> = {
  wrong_answer: "Sai đáp án",
  unclear_question: "Câu hỏi mơ hồ",
  translation_error: "Lỗi dịch",
  audio_issue: "Lỗi âm thanh",
  other: "Khác",
};

export default async function ReportsPage() {
  const open = await db
    .select()
    .from(reports)
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt));

  const lessonIds = [...new Set(open.map((r) => r.lessonId))];
  const userIds = [...new Set(open.map((r) => r.userId))];
  const [lessonMap, userMap] = await Promise.all([
    lessonIds.length
      ? db.select().from(lessons).where(inArray(lessons.id, lessonIds))
      : Promise.resolve([]),
    userIds.length
      ? db.select().from(users).where(inArray(users.id, userIds))
      : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-stone-500 mt-1">Báo lỗi nội dung từ users.</p>
      </div>

      {open.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-300 text-stone-500">
          Không có report nào đang mở.
        </div>
      ) : (
        <div className="space-y-3">
          {open.map((r) => {
            const lesson = lessonMap.find((l) => l.id === r.lessonId);
            const user = userMap.find((u) => u.id === r.userId);
            return (
              <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="danger">{CATEGORY[r.category]}</Badge>
                  <span className="text-xs text-stone-500">{user?.email ?? "?"} · {new Date(r.createdAt).toLocaleString("vi-VN")}</span>
                </div>
                <p className="text-sm mb-2">{r.content}</p>
                {lesson && (
                  <p className="text-xs text-stone-500">
                    Bài: <span className="font-medium text-stone-700">{lesson.title}</span>
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  {lesson && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/lessons/${lesson.id}`} target="_blank">Xem bài</Link>
                    </Button>
                  )}
                  <Button size="sm" variant="success">Đã fix</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
