import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getLessonFull, getNextLessonInSeries } from "@/lib/data";
import { LessonView } from "./lesson-view";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const { id } = await params;
  const data = await getLessonFull(id);
  if (!data) notFound();
  const next = await getNextLessonInSeries(id);
  return <LessonView data={data} next={next} />;
}
