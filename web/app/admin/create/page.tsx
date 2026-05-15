import { getTranslations } from "next-intl/server";
import { CreateLessonForm } from "./create-form";

export default async function CreatePage() {
  const t = await getTranslations("admin.create");
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
      </header>
      <CreateLessonForm />
    </div>
  );
}
