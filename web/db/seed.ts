import "dotenv/config";
import { db } from "./index";
import {
  users,
  onboardingProfiles,
  userProgress,
  skillScores,
  videos,
  transcriptSegments,
  series,
  categories,
  lessons,
  exercises,
  quizQuestions,
  lessonAttempts,
  badges,
  userBadges,
  helpCategories,
  helpArticles,
  contentIntelSuggestions,
  feedback,
  reports,
} from "./schema";
import argon2 from "argon2";
import { sql } from "drizzle-orm";

const uid = () => crypto.randomUUID();

async function clear() {
  // Disable FK temporarily, truncate, re-enable
  await db.execute(sql`SET FOREIGN_KEY_CHECKS=0`);
  const tables = [
    "feedback", "reports", "user_badges", "badges", "exercise_responses",
    "lesson_attempts", "quiz_questions", "exercises", "lessons", "categories", "series",
    "transcript_segments", "videos", "skill_scores", "user_progress",
    "onboarding_profiles", "help_votes", "help_articles", "help_categories",
    "content_intel_suggestions", "ai_jobs", "verification_tokens",
    "sessions", "accounts", "users",
  ];
  for (const t of tables) await db.execute(sql.raw(`TRUNCATE TABLE ${t}`));
  await db.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
}

async function main() {
  console.log("Clearing existing data...");
  await clear();

  // ----- Users -----
  console.log("Creating users...");
  const adminId = uid();
  const userId = uid();
  const pwHash = await argon2.hash("vibevibe");
  await db.insert(users).values([
    {
      id: adminId,
      email: "admin@vibeenglish.local",
      name: "Admin Vibe",
      passwordHash: pwHash,
      role: "admin",
    },
    {
      id: userId,
      email: "demo@vibeenglish.local",
      name: "Demo User",
      passwordHash: pwHash,
      role: "user",
    },
  ]);

  await db.insert(onboardingProfiles).values({
    userId,
    goals: ["email", "meeting", "foreign-company"],
    industries: ["engineer", "manager"],
    dailyMinutes: 15,
    level: "B1",
    targetLevel: "B2",
    placementResult: {
      answers: [],
      skillScores: { vocabulary: 65, grammar: 60, reading: 70, listening: 55 },
    },
    completedAt: new Date(),
  });

  await db.insert(userProgress).values({
    userId,
    xp: 320,
    streakDays: 4,
    longestStreak: 7,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    totalLessons: 6,
    totalMinutes: 95,
  });

  await db.insert(skillScores).values([
    { userId, skill: "vocabulary", score: 68 },
    { userId, skill: "grammar", score: 62 },
    { userId, skill: "reading", score: 72 },
    { userId, skill: "listening", score: 55 },
  ]);

  // ----- Categories -----
  console.log("Creating categories...");
  const categoryDefs = [
    { slug: "business", title: "Kinh doanh & Công sở", icon: "💼", description: "Email công việc, meeting, presentation" },
    { slug: "communication", title: "Giao tiếp đời sống", icon: "💬", description: "Tiếng Anh hàng ngày, hội thoại tự nhiên" },
    { slug: "tech", title: "Công nghệ", icon: "💻", description: "IT, lập trình, sản phẩm số" },
    { slug: "food", title: "Ẩm thực", icon: "🍜", description: "Đồ ăn, nhà hàng, công thức nấu ăn" },
    { slug: "culture", title: "Văn hoá", icon: "🎭", description: "Lễ hội, phong tục, lifestyle quốc tế" },
    { slug: "travel", title: "Du lịch", icon: "✈️", description: "Đặt vé, sân bay, hỏi đường, trải nghiệm" },
    { slug: "entertainment", title: "Giải trí", icon: "🎬", description: "Phim ảnh, âm nhạc, thể thao" },
    { slug: "academic", title: "Học thuật", icon: "🎓", description: "TOEIC, IELTS, học thuật chuẩn quốc tế" },
  ];
  const categoryIds: Record<string, string> = {};
  for (let i = 0; i < categoryDefs.length; i++) {
    const id = uid();
    categoryIds[categoryDefs[i].slug] = id;
    await db.insert(categories).values({ id, ...categoryDefs[i], order: i });
  }

  // ----- Series + Videos + Lessons -----
  console.log("Creating content...");
  const seriesId = uid();
  await db.insert(series).values({
    id: seriesId,
    title: "Business English Essentials",
    description: "Series 8 tập về tiếng Anh nơi công sở",
    level: "B1",
  });

  const videoId = uid();
  await db.insert(videos).values({
    id: videoId,
    youtubeId: "dQw4w9WgXcQ",
    title: "How to lead a stand-up meeting in English",
    durationSec: 360,
    status: "indexed",
    indexedAt: new Date(),
    publishedAt: new Date(),
  });

  // Transcript segments
  const segments = [
    { startSec: 0, endSec: 6, en: "Good morning everyone, welcome to today's stand-up.", vi: "Chào mọi người, chào mừng đến với stand-up hôm nay." },
    { startSec: 6, endSec: 13, en: "Let's go around the room and share three things.", vi: "Hãy lần lượt chia sẻ ba điều." },
    { startSec: 13, endSec: 22, en: "What you did yesterday, what you're doing today, and any blockers.", vi: "Việc bạn đã làm hôm qua, việc hôm nay, và bất kỳ vướng mắc nào." },
    { startSec: 22, endSec: 30, en: "I'll start. Yesterday I finished the API integration.", vi: "Tôi bắt đầu nhé. Hôm qua tôi hoàn thành tích hợp API." },
    { startSec: 30, endSec: 40, en: "Today I'm focusing on writing unit tests for the new endpoints.", vi: "Hôm nay tôi tập trung viết unit test cho các endpoint mới." },
    { startSec: 40, endSec: 48, en: "No blockers on my side. Let's circle back at the end if needed.", vi: "Không có vướng mắc gì. Quay lại cuối nếu cần nhé." },
    { startSec: 48, endSec: 58, en: "Sarah, over to you.", vi: "Sarah, đến lượt bạn." },
    { startSec: 58, endSec: 68, en: "Thanks. I'll keep it brief: I shipped the login flow yesterday.", vi: "Cảm ơn. Tôi nói gọn: hôm qua tôi đã đẩy xong flow login." },
    { startSec: 68, endSec: 78, en: "Today I'm working on the onboarding screens.", vi: "Hôm nay tôi làm các màn onboarding." },
    { startSec: 78, endSec: 90, en: "One blocker: I need the design specs from the design team.", vi: "Một vướng mắc: tôi cần spec thiết kế từ team design." },
  ];
  await db.insert(transcriptSegments).values(
    segments.map((s, i) => ({ videoId, idx: i, ...s }))
  );

  // Lessons: 1 video_quiz with quiz + writing + speaking, plus various others
  const lessonDefs: Array<{
    title: string;
    type: "video_quiz" | "quiz" | "audio_quiz" | "writing" | "speaking";
    level: "A1" | "A2" | "B1" | "B2" | "C1";
    videoId?: string;
    seriesId?: string;
    categorySlug?: string;
    description?: string;
    orderInSeries?: number;
    duration: number;
    quiz?: { q: string; opts: string[]; correct: number; skill: "vocabulary" | "grammar" | "reading" | "listening" }[];
    writing?: { prompt: string; minWords: number };
    speaking?: { target: string };
    published?: boolean;
    queued?: boolean;
  }> = [
    {
      title: "Stand-up meeting: introduction & blockers",
      type: "video_quiz",
      level: "B1",
      videoId,
      seriesId,
      categorySlug: "business",
      description: "Học cách dẫn dắt cuộc họp stand-up hàng ngày — chia sẻ tiến độ, focus và blockers theo phong cách chuyên nghiệp.",
      orderInSeries: 1,
      duration: 360,
      quiz: [
        { q: "What does 'stand-up' refer to in this context?", opts: ["A type of comedy show", "A short daily team meeting", "Standing exercise", "A speech contest"], correct: 1, skill: "vocabulary" },
        { q: "What three things does each person share?", opts: ["Yesterday/today/blockers", "Pros/cons/votes", "Goals/risks/budget", "Wins/losses/draws"], correct: 0, skill: "listening" },
        { q: "'Circle back' means:", opts: ["Walk in circles", "Go home", "Return to discuss later", "Cancel a meeting"], correct: 2, skill: "vocabulary" },
        { q: "Sarah's blocker is:", opts: ["Internet down", "Need design specs", "Sick teammate", "Budget approval"], correct: 1, skill: "listening" },
        { q: "Which is the most polite request?", opts: ["I want specs.", "Give me specs.", "I need the design specs.", "Could you share the design specs when you have a moment?"], correct: 3, skill: "grammar" },
      ],
      writing: { prompt: "Imagine you're leading tomorrow's stand-up. Write a short opening (3-4 sentences) covering: yesterday's progress, today's focus, and one blocker.", minWords: 40 },
      speaking: { target: "Today I'm focusing on writing unit tests for the new endpoints." },
      published: true,
    },
    {
      title: "Daily English: greeting colleagues",
      type: "quiz",
      level: "A2",
      categorySlug: "communication",
      description: "Chào hỏi đồng nghiệp tự nhiên — các cụm thường gặp trong môi trường công sở quốc tế.",
      duration: 240,
      quiz: [
        { q: "Best response to 'How's it going?':", opts: ["I'm 25 years old.", "Pretty good, thanks!", "Yes please.", "Goodbye!"], correct: 1, skill: "vocabulary" },
        { q: "When you arrive at the office, you might say:", opts: ["See you later", "Have a nice weekend", "Good morning", "Cheers"], correct: 2, skill: "vocabulary" },
        { q: "'Catch up' in 'Let's catch up later' means:", opts: ["Run faster", "Chat or talk", "Throw a ball", "Pay a debt"], correct: 1, skill: "vocabulary" },
      ],
      published: true,
    },
    {
      title: "Email opener templates for B1",
      type: "writing",
      level: "B1",
      categorySlug: "business",
      description: "Các mẫu mở đầu email công việc chuyên nghiệp — request, follow-up, introduction.",
      duration: 300,
      writing: { prompt: "Write a professional email opening (2-3 sentences) to a colleague asking for a status update on Project X.", minWords: 30 },
      published: true,
    },
    {
      title: "Pronunciation: business idioms",
      type: "speaking",
      level: "B2",
      categorySlug: "business",
      description: "Luyện phát âm các idioms phổ biến nơi công sở — touch base, circle back, action items.",
      duration: 180,
      speaking: { target: "Let's touch base after the meeting to circle back on the action items." },
      published: true,
    },
    {
      title: "Conditional sentences in business context",
      type: "quiz",
      level: "B2",
      categorySlug: "business",
      description: "Câu điều kiện loại 1/2/3 trong ngữ cảnh đàm phán và lập kế hoạch dự án.",
      duration: 360,
      quiz: [
        { q: "If we ___ the deadline, the client would be upset.", opts: ["miss", "missed", "had missed", "will miss"], correct: 1, skill: "grammar" },
        { q: "Had we known earlier, we ___ the proposal.", opts: ["change", "would change", "would have changed", "had changed"], correct: 2, skill: "grammar" },
        { q: "Unless they ___ today, the launch is delayed.", opts: ["respond", "responds", "responded", "will respond"], correct: 0, skill: "grammar" },
      ],
      published: true,
    },
    {
      title: "Listening: airport announcements",
      type: "audio_quiz",
      level: "A2",
      categorySlug: "travel",
      description: "Nghe và hiểu thông báo tại sân bay — boarding, gate, delay, flight info.",
      duration: 240,
      quiz: [
        { q: "'Now boarding' means:", opts: ["Plane is delayed", "You can enter the plane", "Plane has arrived", "Flight is cancelled"], correct: 1, skill: "listening" },
        { q: "'Gate change' means:", opts: ["Doors closed", "Different boarding location", "Flight number changed", "New crew"], correct: 1, skill: "listening" },
      ],
      published: true,
    },
    {
      title: "IELTS Speaking: describe a recent trip",
      type: "speaking",
      level: "B2",
      categorySlug: "academic",
      description: "Đề bài Speaking IELTS Part 2 — mô tả chuyến đi gần nhất (cue card 2 phút).",
      duration: 240,
      speaking: { target: "I'd like to talk about a recent trip I took to the countryside last summer." },
      queued: true,
    },
    {
      title: "Reading: a startup press release",
      type: "quiz",
      level: "B2",
      categorySlug: "tech",
      description: "Đọc hiểu một press release của startup công nghệ — funding, product launch, terminology.",
      duration: 360,
      quiz: [
        { q: "A 'Series A' typically refers to:", opts: ["TV show", "Funding round", "Product version", "Stock ticker"], correct: 1, skill: "reading" },
        { q: "'Garner support' means:", opts: ["Lose support", "Receive support", "Pay for support", "Document support"], correct: 1, skill: "reading" },
      ],
      queued: true,
    },
  ];

  const lessonIds: string[] = [];
  for (const def of lessonDefs) {
    const id = uid();
    lessonIds.push(id);
    await db.insert(lessons).values({
      id,
      title: def.title,
      description: def.description ?? null,
      type: def.type,
      level: def.level,
      videoId: def.videoId ?? null,
      seriesId: def.seriesId ?? null,
      categoryId: def.categorySlug ? categoryIds[def.categorySlug] : null,
      orderInSeries: def.orderInSeries ?? null,
      durationSec: def.duration,
      tags: [def.level.toLowerCase(), def.type],
      status: def.published ? "published" : def.queued ? "queued" : "draft",
      publishedAt: def.published ? new Date() : null,
      rating: def.published ? 4.5 : null,
    });

    if (def.quiz?.length) {
      const exId = uid();
      await db.insert(exercises).values({ id: exId, lessonId: id, kind: "quiz", order: 0, payload: { kind: "quiz" } });
      for (let i = 0; i < def.quiz.length; i++) {
        const q = def.quiz[i];
        await db.insert(quizQuestions).values({
          id: uid(),
          exerciseId: exId,
          order: i,
          question: q.q,
          options: q.opts,
          correctIndex: q.correct,
          skill: q.skill,
        });
      }
    }
    if (def.writing) {
      await db.insert(exercises).values({
        id: uid(),
        lessonId: id,
        kind: "writing",
        order: 1,
        payload: { kind: "writing", prompt: def.writing.prompt, minWords: def.writing.minWords },
      });
    }
    if (def.speaking) {
      await db.insert(exercises).values({
        id: uid(),
        lessonId: id,
        kind: "speaking",
        order: 2,
        payload: { kind: "speaking", targetText: def.speaking.target },
      });
    }
  }

  // Mark a few as completed for the demo user
  console.log("Creating attempts...");
  for (let i = 1; i <= 3; i++) {
    const lessonIdToComplete = lessonIds[i + 1];
    if (!lessonIdToComplete) continue;
    const startedAt = new Date(Date.now() - i * 86400000);
    const completedAt = new Date(startedAt.getTime() + 12 * 60000);
    await db.insert(lessonAttempts).values({
      id: uid(),
      userId,
      lessonId: lessonIdToComplete,
      status: "completed",
      score: 70 + i * 5,
      xpAwarded: 50,
      startedAt,
      completedAt,
      aiFeedback: {
        strengths: ["Hiểu nội dung chính tốt", "Phản xạ chọn đáp án nhanh"],
        improvements: ["Cần để ý chi tiết về thì"],
        tips: ["Học đều mỗi ngày để giữ streak"],
        vocabulary: ["circle back", "touch base", "stand-up", "blockers"],
      },
    });
  }

  // ----- Badges -----
  console.log("Creating badges...");
  const badgeDefs = [
    { slug: "first-lesson", title: "Bài đầu tiên", icon: "🎯", description: "Hoàn thành bài học đầu tiên" },
    { slug: "streak-3", title: "Streak 3 ngày", icon: "🔥", description: "Học 3 ngày liên tiếp" },
    { slug: "streak-7", title: "Streak 7 ngày", icon: "🌟", description: "Học 7 ngày liên tiếp" },
    { slug: "writer", title: "Tay viết", icon: "✍️", description: "Hoàn thành 5 bài Writing" },
    { slug: "speaker", title: "Loa lớn", icon: "🎤", description: "Hoàn thành 5 bài Speaking" },
    { slug: "level-up", title: "Level Up", icon: "🚀", description: "Đạt level B2" },
  ];
  for (const b of badgeDefs) {
    const id = uid();
    await db.insert(badges).values({ id, ...b, criteria: {} });
    if (b.slug === "first-lesson" || b.slug === "streak-3") {
      await db.insert(userBadges).values({ userId, badgeId: id });
    }
  }

  // ----- Help content -----
  console.log("Creating help content...");
  const helpCatDefs = [
    { slug: "getting-started", title: "Bắt đầu & Onboarding", icon: "🚀" },
    { slug: "lessons", title: "Học bài & Bài tập", icon: "📚" },
    { slug: "speaking", title: "Luyện Speaking", icon: "🎤" },
    { slug: "writing", title: "Luyện Writing", icon: "✍️" },
    { slug: "scoring", title: "Điểm số & Trình độ", icon: "📊" },
    { slug: "account", title: "Tài khoản & Cài đặt", icon: "⚙️" },
    { slug: "billing", title: "Gói Pro & Thanh toán", icon: "💰" },
  ];
  const catMap: Record<string, string> = {};
  for (let i = 0; i < helpCatDefs.length; i++) {
    const id = uid();
    catMap[helpCatDefs[i].slug] = id;
    await db.insert(helpCategories).values({ id, ...helpCatDefs[i], order: i });
  }

  const articleDefs = [
    { cat: "getting-started", title: "Làm sao bắt đầu nhanh?", body: "Sau khi đăng ký, bạn sẽ qua 6 bước onboarding: chọn mục tiêu, ngành nghề, thời gian, và làm placement quiz. Toàn bộ chỉ mất 5-7 phút." },
    { cat: "getting-started", title: "Tôi có thể bỏ qua placement quiz không?", body: "Có. Click nút 'Bỏ qua quiz' ở header. Hệ thống sẽ tạm gán A2 và bạn có thể làm quiz sau từ trang Settings." },
    { cat: "lessons", title: "Bài học có những loại nào?", body: "5 loại: Video → Quiz, Quiz thuần, Audio → Quiz, Writing, Speaking. Mỗi loại có giao diện riêng phù hợp với kỹ năng cần luyện." },
    { cat: "lessons", title: "Transcript sync hoạt động như thế nào?", body: "Khi xem video, transcript ở panel bên cạnh tự động highlight đoạn đang nói. Click vào bất kỳ đoạn nào để video tua đến đó." },
    { cat: "speaking", title: "Tại sao mic không hoạt động?", body: "Hãy cấp quyền microphone cho trình duyệt. Trên Chrome, click vào icon ổ khoá ở thanh địa chỉ → Site settings → Microphone → Allow." },
    { cat: "speaking", title: "AI chấm phát âm dựa trên gì?", body: "AI phân tích từng âm vị (phoneme) của bạn và so sánh với cách phát âm chuẩn của câu mẫu. Từng từ được gán điểm và hiển thị chip màu." },
    { cat: "writing", title: "Tiêu chí chấm Writing là gì?", body: "Tùy theo level: A1-A2 chỉ chấm Grammar + Vocabulary. B1+ thêm Coherence. C1 thêm Style. AI annotate lỗi trực tiếp trong văn bản." },
    { cat: "scoring", title: "Khi nào tôi lên level?", body: "Hệ thống tự động theo dõi và lên level khi điểm trung bình các kỹ năng vượt ngưỡng. Bạn sẽ nhận thông báo Level Up khi đủ điều kiện." },
    { cat: "account", title: "Đổi mục tiêu học sau onboarding?", body: "Vào Profile → 'Chỉnh sửa mục tiêu' (hoặc /settings). Bạn có thể thay đổi mục tiêu, ngành nghề, thời gian học, và target level bất kỳ lúc nào." },
    { cat: "billing", title: "Có gói Pro chưa?", body: "Hiện tại Vibe English đang ở giai đoạn 1 — toàn bộ tính năng miễn phí. Khi có gói Pro, bạn sẽ được thông báo qua email." },
  ];
  for (let i = 0; i < articleDefs.length; i++) {
    const a = articleDefs[i];
    await db.insert(helpArticles).values({
      id: uid(),
      categoryId: catMap[a.cat],
      title: a.title,
      body: a.body,
      status: "published",
      order: i,
      helpfulCount: Math.floor(Math.random() * 20) + 5,
      unhelpfulCount: Math.floor(Math.random() * 4),
    });
  }

  // ----- Content Intel suggestions -----
  console.log("Creating intel suggestions...");
  await db.insert(contentIntelSuggestions).values([
    {
      id: uid(),
      title: "Conditional clauses for B1 learners",
      reason: "Nhiều users level B1 liên tục fail bài về if-clauses. Chưa có video cover chủ đề này. Search 'conditional sentences' không trả về kết quả phù hợp.",
      priority: "high",
      skill: "grammar",
      level: "B1",
      stats: { usersStruggling: 47, failedSearches: 23, userRequests: 12 },
    },
    {
      id: uid(),
      title: "Email closing phrases (B1-B2)",
      reason: "Mục tiêu phổ biến nhất là 'Viết email công việc'. Users đang thiếu nội dung về closing phrases tự nhiên.",
      priority: "medium",
      skill: "writing",
      level: "B2",
      stats: { usersStruggling: 28, userRequests: 8 },
    },
    {
      id: uid(),
      title: "Pronunciation: th/dh sounds",
      reason: "Bài speaking liên tục mất điểm ở âm /θ/ và /ð/. Nhiều users yêu cầu bài luyện riêng.",
      priority: "high",
      skill: "speaking",
      level: "A2",
      stats: { usersStruggling: 62, userRequests: 31 },
    },
  ]);

  // ----- Sample feedback & reports -----
  await db.insert(feedback).values([
    {
      id: uid(),
      userId,
      type: "feature_request",
      content: "Mình muốn có thể download bài học để học offline khi đi tàu.",
      wantsReply: true,
      contactEmail: "demo@vibeenglish.local",
      status: "new",
    },
    {
      id: uid(),
      userId: null,
      type: "experience_rating",
      content: "App rất hay, transcript sync chuẩn không lệch. Quá mượt!",
      rating: 5,
      wantsReply: false,
      status: "new",
    },
  ]);

  await db.insert(reports).values({
    id: uid(),
    userId,
    lessonId: lessonIds[1],
    category: "translation_error",
    content: "Dịch tiếng Việt của câu thứ 3 hơi cứng, nên dùng 'vướng mắc' thay vì 'block'.",
    status: "open",
  });

  console.log("✓ Seed complete.");
  console.log("\nLogin credentials:");
  console.log("  Admin: admin@vibeenglish.local / vibevibe");
  console.log("  User:  demo@vibeenglish.local / vibevibe");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
