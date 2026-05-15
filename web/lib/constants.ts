export const GOALS = [
  { id: "email", icon: "📧", title: "Viết email công việc", desc: "Soạn email chuyên nghiệp, đúng tone" },
  { id: "meeting", icon: "💼", title: "Họp & thuyết trình", desc: "Tự tin trong cuộc họp tiếng Anh" },
  { id: "foreign-company", icon: "🏢", title: "Làm việc môi trường nước ngoài", desc: "Giao tiếp hằng ngày với đồng nghiệp" },
  { id: "toeic", icon: "📝", title: "Thi TOEIC", desc: "Mục tiêu 700+ cho bằng cấp" },
  { id: "ielts", icon: "🎓", title: "Thi IELTS / TOEFL", desc: "Du học, định cư, học bổng" },
  { id: "travel", icon: "✈️", title: "Du lịch nước ngoài", desc: "Giao tiếp cơ bản khi đi du lịch" },
  { id: "media", icon: "🎬", title: "Xem phim / nghe nhạc không phụ đề", desc: "Hiểu nội dung tự nhiên" },
  { id: "academic", icon: "📚", title: "Đọc tài liệu học thuật", desc: "Paper, sách chuyên ngành" },
  { id: "immigration", icon: "🌍", title: "Du học / định cư", desc: "Chuẩn bị cho hành trình ra nước ngoài" },
  { id: "friends", icon: "🤝", title: "Kết bạn với người nước ngoài", desc: "Giao tiếp xã hội tự nhiên" },
] as const;

export const INDUSTRIES = [
  { id: "engineer", icon: "💻", title: "Kỹ sư / Lập trình viên" },
  { id: "marketing", icon: "📣", title: "Marketing / Sales" },
  { id: "finance", icon: "💰", title: "Tài chính / Kế toán" },
  { id: "design", icon: "🎨", title: "Thiết kế / Sáng tạo" },
  { id: "manager", icon: "👔", title: "Quản lý / Điều hành" },
  { id: "health", icon: "🏥", title: "Y tế / Sức khỏe" },
  { id: "education", icon: "👩‍🏫", title: "Giáo dục / Đào tạo" },
  { id: "business", icon: "🚀", title: "Kinh doanh / Khởi nghiệp" },
  { id: "student", icon: "🎒", title: "Sinh viên" },
  { id: "other", icon: "🌟", title: "Khác" },
] as const;

export const TIME_OPTIONS = [
  { id: 5, label: "5 phút", desc: "Session siêu ngắn" },
  { id: 15, label: "15 phút", desc: "Cân bằng (gợi ý)", recommended: true },
  { id: 30, label: "30 phút", desc: "Học sâu hơn" },
] as const;

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const LEVEL_INFO: Record<CefrLevel, { name: string; description: string; color: string }> = {
  A1: { name: "Beginner", description: "Vốn từ và câu cơ bản nhất", color: "bg-stone-500" },
  A2: { name: "Elementary", description: "Giao tiếp đơn giản về chủ đề quen thuộc", color: "bg-sky-500" },
  B1: { name: "Intermediate", description: "Hiểu ý chính, có thể tự diễn đạt", color: "bg-emerald-500" },
  B2: { name: "Upper-Intermediate", description: "Giao tiếp tự nhiên với người bản ngữ", color: "bg-amber-500" },
  C1: { name: "Advanced", description: "Tiếng Anh linh hoạt, chính xác, hiệu quả", color: "bg-brand-600" },
};

export const SKILL_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
};

export const LESSON_TYPES = [
  { id: "video_quiz", label: "Video → Quiz", icon: "🎬", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "quiz", label: "Quiz", icon: "📝", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "audio_quiz", label: "Audio → Quiz", icon: "🎧", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "writing", label: "Writing", icon: "✍️", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "speaking", label: "Speaking", icon: "🎤", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
] as const;
