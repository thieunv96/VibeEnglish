import { CreateLessonForm } from "./create-form";

export default function CreatePage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Tạo bài học thủ công</h1>
        <p className="text-sm text-stone-500 mt-1">
          Tạo bài đặc thù không qua pipeline video — bài ôn tập, bài mẫu TOEIC/IELTS, hoặc thử nghiệm format mới.
        </p>
      </header>
      <CreateLessonForm />
    </div>
  );
}
