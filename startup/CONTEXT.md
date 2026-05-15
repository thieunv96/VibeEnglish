# Vibe English

> **Tự do học, tự tin nói**

Nền tảng học tiếng Anh cá nhân hoá dựa trên AI. Nội dung xoay quanh video thực tế từ kênh YouTube riêng của platform. AI tự động tạo bài tập, chấm điểm và điều chỉnh lộ trình học theo trình độ + mục tiêu thực tế của từng người dùng.

---

## Mục lục

1. [Tổng quan sản phẩm](#1-tổng-quan-sản-phẩm)
2. [Người dùng mục tiêu](#2-người-dùng-mục-tiêu)
3. [Hệ thống trình độ](#3-hệ-thống-trình-độ)
4. [Loại bài học](#4-loại-bài-học)
5. [UI/UX — Mô tả chi tiết từng màn hình](#5-uiux--mô-tả-chi-tiết-từng-màn-hình)
6. [User Workflow](#6-user-workflow)
7. [Admin Workflow](#7-admin-workflow)
8. [Content Pipeline](#8-content-pipeline)
9. [AI trong hệ thống](#9-ai-trong-hệ-thống)
10. [Monetization](#10-monetization)

> **Các tính năng được mô tả trong tài liệu này:**
> User: Onboarding · Content Library · Lesson Detail · Lesson Result · Profile & Progress · Cập nhật mục tiêu & kế hoạch · Góp ý hệ thống · Help / FAQ
> Admin: Dashboard · Lesson Queue · Tạo bài thủ công · Video Manager · Content Intelligence · Reports · User Feedback · Analytics · Users · Help Content

---

## 1. Tổng quan sản phẩm

### Vấn đề

Người đi làm tại môi trường có yếu tố nước ngoài cần tiếng Anh thực tế nhưng không có thời gian học trung tâm. Các app học tiếng Anh phổ biến thiếu ngữ cảnh công việc, không cá nhân hoá đủ sâu, và không có feedback chất lượng.

### Giải pháp

Vibe English cung cấp micro-session học linh hoạt theo thời gian người dùng tự chọn. Toàn bộ nội dung được xây dựng từ video YouTube thực tế của kênh riêng — AI xử lý video, tạo bài tập đa dạng, chấm điểm tức thì và liên tục điều chỉnh lộ trình dựa trên hiệu suất thực tế.

### Nguyên tắc thiết kế

- **Cá nhân hoá sâu** — Mỗi người học có lộ trình, bài tập và feedback riêng biệt.
- **Friction thấp** — Học được ngay, không cần setup. Session ngắn, fit vào lịch bận.
- **Feedback tức thì** — AI chấm và nhận xét ngay khi nộp bài.
- **Content sống** — Thư viện bài học cập nhật liên tục từ video mới, không bao giờ cũ.
- **Vòng lặp động lực** — Streak, XP, level up và badge tạo thói quen học đều đặn.

---

## 2. Người dùng mục tiêu

### Segments

**Người đi làm** — Bận rộn, cần tiếng Anh thực tế cho công việc: viết email, meeting, giao tiếp với đối tác nước ngoài. Thời gian ít, cần session ngắn và kết quả nhanh.

**Sinh viên** — Có nhiều thời gian hơn, hướng đến chứng chỉ quốc tế hoặc chuẩn bị cho môi trường làm việc.

**Người mới bắt đầu** — Chưa có nền tảng, cần onboarding rõ ràng và lộ trình có cấu trúc.

### Mục tiêu học (người dùng tự chọn khi onboarding, chọn được nhiều)

- Viết email công việc
- Họp & thuyết trình
- Làm việc tại công ty có yếu tố nước ngoài
- Thi TOEIC
- Thi IELTS / TOEFL
- Du lịch nước ngoài
- Xem phim / nghe nhạc không cần phụ đề
- Đọc tài liệu học thuật
- Du học / định cư
- Kết bạn với người nước ngoài

### Ngành nghề (chọn được nhiều, dùng để cá nhân hoá ngữ cảnh bài học)

Kỹ sư / Lập trình viên · Marketing / Sales · Tài chính / Kế toán · Thiết kế / Sáng tạo · Quản lý / Điều hành · Y tế / Sức khỏe · Giáo dục / Đào tạo · Kinh doanh / Khởi nghiệp · Sinh viên · Khác

---

## 3. Hệ thống trình độ

Dùng chuẩn CEFR quốc tế để dễ so sánh với các chứng chỉ phổ biến.

| Level | Tên | Đặc điểm |
|---|---|---|
| A1 | Beginner | Vốn từ và câu cơ bản nhất |
| A2 | Elementary | Giao tiếp đơn giản về chủ đề quen thuộc |
| B1 | Intermediate | Hiểu ý chính, có thể tự diễn đạt |
| B2 | Upper-Intermediate | Giao tiếp tự nhiên với người bản ngữ |
| C1 | Advanced | Tiếng Anh linh hoạt, chính xác, hiệu quả |

Level được xác định lần đầu qua placement quiz khi onboarding, sau đó tự động cập nhật dựa trên kết quả bài học thực tế. Khi đủ điều kiện, hệ thống tự lên level và thông báo.

---

## 4. Loại bài học

Mỗi bài học được gắn một loại. Loại bài quyết định giao diện, nội dung và cách AI chấm điểm.

### 🎬 Video → Quiz
Xem video từ kênh YouTube, transcript song ngữ hiển thị song song và tự highlight theo thời gian thực. Sau khi xem, làm bài tập comprehension từ nội dung video.

### 📝 Quiz
Bài trắc nghiệm thuần về Vocabulary hoặc Grammar. Không cần video. Phù hợp session ngắn hoặc ôn tập nhanh.

### 🎧 Audio → Quiz
Nghe đoạn audio ngắn rồi trả lời câu hỏi. Tập trung thuần vào kỹ năng nghe, không có hình ảnh.

### ✍️ Writing → AI Feedback
Đọc prompt → viết đoạn văn → AI chấm và annotate lỗi trực tiếp trên văn bản. Tiêu chí chấm tùy theo level.

### 🎤 Speaking → AI Score
Đọc to câu mẫu → AI phân tích phát âm từng từ → hiển thị từng từ chip màu theo mức độ chính xác.

---

## 5. UI/UX — Mô tả chi tiết từng màn hình

### Màn hình 1 — Đăng nhập / Đăng ký

**Bố cục tổng thể:** Chia đôi màn hình theo chiều ngang trên desktop. Panel trái là branding, panel phải là form. Trên mobile, panel trái ẩn, chỉ hiển thị form với logo nhỏ đầu trang.

**Panel trái — Branding:**
Nền gradient tím đậm. Logo Vibe English, tagline, đoạn mô tả ngắn về platform, danh sách tính năng nổi bật theo chiều dọc. Hai vòng tròn trang trí mờ ở góc tạo chiều sâu.

**Panel phải — Form:**
Nền trắng. Tab switcher đầu trang để toggle "Đăng nhập" / "Đăng ký". Phía trên form có hai nút social login (Google, GitHub). Đường phân cách "hoặc đăng nhập bằng email" chia social với form.

Tab **Đăng nhập:** Email, Password với link "Quên mật khẩu?" căn phải, nút CTA tím full-width.

Tab **Đăng ký:** Thêm 2 input Họ và Tên (2 cột), email, password. Submit → success animation → redirect sang onboarding.

**Sau đăng nhập:** Đã onboarding → về Content Library. Lần đầu → vào Onboarding.

---

### Màn hình 2 — Onboarding

Header cố định: logo trái, progress bar giữa fill theo bước, step label phải. Nút "Quay lại" và "Tiếp tục" ở footer. Từ bước quiz trở đi có thêm nút "Bỏ qua quiz" ở header.

**Bước 1 — Welcome:**
Màn hình chào, căn giữa. Logo lớn, tagline, mô tả ngắn, 4 badge tính năng ngang hàng. Nút "Bắt đầu nào →".

**Bước 2 — Chọn mục tiêu:**
Tiêu đề + subtitle "có thể chọn nhiều". Grid 2 cột, 10 card mục tiêu — mỗi card: checkbox trái, icon, tên (bold), mô tả ngắn. Khi chọn: card fill tím nhạt, border tím, checkbox fill tím + tick. Counter "Đã chọn: N mục tiêu" cập nhật realtime. Nút "Tiếp tục" chỉ enable khi chọn ≥ 1.

**Bước 3 — Thông tin cá nhân:**
Phần trên: grid 2 cột 10 card ngành nghề, cùng kiểu multi-select với mục tiêu.
Phần dưới: 3 card thời gian học (5' / 15' / 30') dạng hàng ngang — single select, mặc định 15'. Card được chọn fill tím nhạt.

**Bước 4 — Placement Quiz:**
Info chips đầu trang: thời gian ước tính, số câu, "Adaptive AI". Card quiz: số thứ tự + skill type nhỏ phía trên, câu hỏi bold, 4 lựa chọn A/B/C/D dạng hàng dọc.

Hành vi khi trả lời:
- Đúng → option fill xanh lá, tự động load câu kế sau khoảng ngắn
- Sai → option fill đỏ nhạt, hiện 2 nút: "Xem đáp án" (tùy chọn) và "Câu tiếp →" (bỏ qua)
- Không bao giờ force reveal đáp án

5 dot indicator dưới card: active = tím kéo dài, đúng = xanh lá, sai = cam, chưa đến = xám.

**Bước 5 — Đang xử lý:**
Spinner tím xoay, text mô tả AI đang làm gì. Tự động chuyển sang kết quả sau vài giây.

**Bước 6 — Kết quả:**
Vòng tròn lớn căn giữa với CEFR level + tên level — animation pop vào. Mô tả ngắn điểm yếu cần cải thiện. Box 4 skill bars (Vocabulary, Grammar, Reading, Listening) với điểm từng skill — thanh thấp nhất fill màu khác để nổi bật. Nút "Bắt đầu học →".

---

### Màn hình 3 — Content Library Dashboard

**Top Navigation:**
Cố định đầu trang. Trái: Logo + tagline nhỏ. Phải: Streak counter (icon lửa + số ngày), chuông thông báo, avatar tròn (initials). Navigation link sang Profile.

**Hero Section:**
Greeting cá nhân hoá theo buổi + tên user. Subtitle gợi ý số bài nên học hôm nay. Level badge góc phải. Ba card thống kê ngang:
- Card 1: Số bài hoàn thành + delta tuần này
- Card 2: Skill bars nhỏ hiển thị điểm yếu cần luyện
- Card 3: Tiến độ mục tiêu tuần (N/N) + progress bar

**Toolbar:**
Search input lọc realtime theo tên bài (flex 1), filter chips theo loại bài (Tất cả / Video / Quiz / Speaking / Audio / Writing), nút toggle Grid/List ở ngoài cùng phải.

**Section "Gợi ý cho bạn":**
3 bài AI recommend cao nhất. Mỗi card: thumbnail icon trên nền xám, type badge màu, tiêu đề, meta (level + duration), thanh mỏng đáy card thể hiện mức recommendation (dài hơn = phù hợp hơn). Link "Xem tất cả".

**Section "Tất cả bài học":**
Grid hoặc List theo toggle. Filter chips và search hoạt động trên section này.

**Section "Đã hoàn thành":**
Cùng layout nhưng card mờ hơn, thumbnail có overlay xanh nhạt + icon tick lớn giữa. Link "Xem tất cả (N)".

**Grid View:** 3 cột desktop, 2 cột tablet, 1 cột mobile.
**List View:** Mỗi row: icon vuông nhỏ, tên bài (truncate), meta nhỏ, type badge căn phải.
**Filter realtime:** Card ẩn/hiện ngay không cần reload.

---

### Màn hình 4 — Lesson Detail

**Bố cục tổng thể:** Split ~55% / ~45% theo chiều ngang trên desktop. Panel trái: Video + Transcript. Panel phải: Bài tập. Header nav riêng cố định trên cùng. Trên mobile: stack dọc, video trên cùng, transcript, rồi bài tập.

**Header Nav:**
Nút "← Thư viện", tiêu đề bài học giữa (truncate nếu dài), series progress phải: "Bài N/M" + dots indicator.

---

**Panel trái — Video:**

*Video Player:*
Nền đen, tỉ lệ 16:9. Khi dừng: nút play lớn ở trung tâm trong vòng tròn mờ. Nhãn nhỏ góc trên trái: "EP.XX · Tên video". Controls bar dưới:
- Hàng 1: Thời gian hiện tại | thanh progress (click seek, drag scrub) | tổng thời gian
- Hàng 2: Play/Pause | Skip back 10s | Skip forward 10s | Tốc độ (0.75× / 1× / 1.25× / 1.5× / 2×) | Volume slider

*Lesson Info:*
Tags hàng đầu: loại bài, level, series (nếu có). Tiêu đề bài học. Meta row: duration, số bài tập, rating sao.

---

**Panel trái — Transcript:**

*Header:*
Tiêu đề "Transcript" + chấm đỏ nhỏ nhấp nháy khi video đang chạy (báo hiệu đang sync live). Toggle Auto-scroll. Lang toggle: EN | Song ngữ | VI.

*Chế độ Song ngữ (mặc định):*
2 cột chia đều. Header cột: "🇬🇧 English" | "🇻🇳 Tiếng Việt". Mỗi segment: timestamp monospace cố định bên trái, cột EN và cột VI song song.

*Chế độ EN Only:* 1 cột tiếng Anh, keyword quan trọng được highlight nền tím nhạt.

*Chế độ VI Only:* 1 cột tiếng Việt.

*Realtime sync:*
Hệ thống đọc thời gian video liên tục. Tìm segment đang được nói (theo timestamp start/end) và highlight: nền tím nhạt, text đậm hơn, timestamp đổi màu tím. Segment đã qua: text xám nhạt hơn. Nếu bật Auto-scroll, transcript tự cuộn giữ segment active trong vùng nhìn thấy.

*Click segment:* Video seek đến đúng thời điểm bắt đầu của segment đó.

---

**Panel phải — Exercises:**

*Tab Bar:* Quiz / Writing / Speaking. Tab active: gạch chân tím. Chuyển tab không mất dữ liệu đã nhập.

*Tab Quiz:*
Từng câu: label nhỏ "Câu N · [Skill]", câu hỏi bold, options dạng pill có border.
- Đúng → fill xanh lá, tự next sau khoảng ngắn
- Sai → fill đỏ nhạt (không tự reveal đáp án)

Sau khi hết câu → "Nộp bài" → AI Feedback box xuất hiện phía dưới:
- Header "Nhận xét từ AI"
- Score cards (điểm tổng + điểm theo skill)
- Tip bullets: ✅ điểm mạnh / ↗ cần cải thiện / 💡 gợi ý thêm

*Tab Writing:*
Box prompt nền xám nhạt. Textarea. Word counter realtime. "Nộp bài & nhận feedback". Sau nộp:
- Textarea ẩn, văn bản được annotate (lỗi gạch đỏ dưới, cụm đúng highlight xanh nhạt)
- Skill bars theo tiêu chí (Grammar, Vocabulary, và Coherence tùy level)
- Danh sách gợi ý sửa lỗi cụ thể
- Nút "Nộp lại"

*Tab Speaking:*
Quote box (border trái tím) chứa câu target. Nút record tròn lớn căn giữa. Khi thu âm: pulse animation, icon stop. Sau AI xử lý:
- Điểm tổng to căn giữa
- Phoneme row: từng từ là 1 chip màu (xanh = đúng / vàng = cần cải thiện / đỏ = sai rõ)
- Nhận xét từng từ phát âm chưa chuẩn + gợi ý
- Nút "Thu âm lại"

*Next Bar (cố định dưới panel phải):*
Nền xám nhạt, border trên. Trái: "Bài tiếp theo" + tên bài kế. Phải: nút "Tiếp →" hoặc "Hoàn thành".

---

### Màn hình 5 — Lesson Result

**Celebration Header:**
Gradient tím full-width, pattern chấm mờ tạo texture. Icon tick trong vòng tròn với animation pop. Tiêu đề "Bài học hoàn thành!" + tên bài + series. Badge XP nhỏ hiển thị điểm vừa nhận.

**Score Cards:**
3 card ngang: Điểm tổng (nổi bật hơn) / Điểm Quiz / Thời gian hoàn thành.

**Level Up Banner (chỉ hiện khi vừa lên level):**
Nền gradient xanh lá, icon trophy, "🎉 Lên level! [cũ] → [mới]". Animation slide in từ dưới.

**Skill Progress:**
Skill bars với điểm hiện tại và delta so với trước. Skill tăng nhiều nhất được nổi bật.

**Từ vựng / Cụm từ bài này:**
Flex wrap chip tím nhạt — những từ/cụm AI chọn làm nổi bật từ nội dung bài. Hover đổi màu.

**AI Feedback:**
Box nền xám nhạt. "Vibe AI Coach". 3 bullets: ✅ điểm mạnh / ↗ cần cải thiện / 💡 gợi ý.

**Streak Counter:**
Banner full-width nền vàng nhạt. Icon lửa + "Streak N ngày liên tiếp 🔥".

**Next Lesson:**
Card bài kế trong series (hoặc bài recommend cao nhất nếu hết series). 2 nút: "Học bài tiếp →" (primary) và "Về thư viện" (secondary).

---

### Màn hình 6 — Profile & Progress

**Top Nav:** Cùng nav với Content Library, active link "Hồ sơ".

**Hero Section:**
Gradient tím. Avatar tròn + level badge overlay góc dưới. Tên + nghề nghiệp + ngày tham gia. Row stats: tổng bài / tổng giờ / badges. Streak counter bên phải.

**Level Progress:**
Thanh từ level hiện tại sang level kế với % và gợi ý cần bao nhiêu bài nữa.

**2 cột Skills + Stats:**
*Skill card:* 5 kỹ năng với thanh ngang. Yếu nhất có tag "Cần luyện" màu và fill màu khác.
*Stats card:* 4 ô 2×2: Bài đã học / Tỉ lệ đúng / Tổng thời gian / Tổng XP.

**Calendar Heatmap:**
Lưới ô vuông ~4 tháng gần nhất, màu theo cường độ học trong ngày (xám = không học → 4 shade tím theo mức độ). Hôm nay có ring ngoài. Hover hiện tooltip. Legend "Ít → Nhiều" ở dưới.

**Badges:**
Grid. Đã đạt: đầy màu. Chưa đạt: mờ. Hover hiện điều kiện đạt được.

**Lịch sử gần đây:**
Danh sách bài học gần nhất: icon loại bài, tên bài, meta, điểm số.

---

### Màn hình 7 — Cài đặt mục tiêu & Kế hoạch học

Người dùng có thể cập nhật lại mục tiêu, ngành nghề, thời gian học và lộ trình học bất kỳ lúc nào sau onboarding. Thay đổi sẽ ảnh hưởng đến recommendation và focus của AI từ session tiếp theo.

**Vị trí truy cập:** Từ Profile screen → nút "Chỉnh sửa mục tiêu" hoặc qua Settings menu.

**Bố cục:** Single column, chia thành các section có thể expand/collapse.

**Section 1 — Mục tiêu học:**
Cùng grid multi-select 10 card như onboarding. Mục tiêu đang active được đánh dấu sẵn. Thêm hoặc bỏ bất kỳ mục tiêu nào. Ghi chú nhỏ: "Thay đổi mục tiêu sẽ ảnh hưởng đến bài học được gợi ý từ hôm nay."

**Section 2 — Ngành nghề:**
Cùng grid multi-select 10 card. Đang chọn gì được đánh dấu sẵn.

**Section 3 — Thời gian học mỗi ngày:**
3 card single-select (5' / 15' / 30'). Thay đổi ảnh hưởng đến số bài gợi ý mỗi ngày và độ dài session.

**Section 4 — Kế hoạch học:**
Hiển thị lộ trình học hiện tại (level hiện tại → target level). Người dùng có thể:
- Đặt lại target level (ví dụ: đang B1 nhưng muốn đạt C1 thay vì B2)
- Xem lại placement result ban đầu
- Nút "Làm lại placement quiz" — nếu cảm thấy level được gán không chính xác, có thể làm lại quiz để hệ thống re-evaluate. Cảnh báo: kết quả mới sẽ ghi đè level hiện tại.

**Footer:** Nút "Lưu thay đổi" (primary) và "Huỷ" (secondary).

---

### Màn hình 8 — Góp ý / Phản hồi hệ thống

Kênh để người dùng chia sẻ ý kiến về platform — khác với "Report lỗi bài học" (dành cho lỗi nội dung cụ thể), đây là feedback về trải nghiệm tổng thể.

**Vị trí truy cập:** Menu phụ hoặc footer của app. Luôn accessible từ mọi màn hình.

**Bố cục:** Form đơn giản, không quá nhiều bước.

**Loại góp ý (single select dạng chip):**
- 💡 Đề xuất tính năng mới
- 🐛 Báo lỗi giao diện / kỹ thuật
- 📚 Góp ý về nội dung học
- ⭐ Đánh giá trải nghiệm chung
- 💬 Khác

**Nội dung:** Textarea tự do. Với loại "Đánh giá trải nghiệm chung" có thêm star rating 1–5 trước textarea.

**Thông tin liên hệ (optional):** Checkbox "Muốn nhận phản hồi từ team" → nếu check thì hiện input email (pre-filled nếu đã đăng nhập).

**Submit:** Toast "Cảm ơn bạn! Góp ý của bạn giúp Vibe English tốt hơn mỗi ngày." Góp ý gửi về Admin Panel → tab "User Feedback".

---

### Màn hình 9 — Help / FAQ (User)

Trung tâm hỗ trợ cho người dùng. Không cần liên hệ admin cho những câu hỏi phổ biến.

**Vị trí truy cập:** Từ nav (icon ?) hoặc từ mọi màn hình khi user gặp khó khăn.

**Bố cục:** Search bar đầu trang + danh sách category + accordion FAQ.

**Search bar:**
Tìm kiếm realtime trong toàn bộ nội dung Help. Gõ → kết quả hiện ngay bên dưới. Nếu không tìm thấy → gợi ý "Gửi góp ý cho chúng tôi".

**Categories (icon + label):**
- 🚀 Bắt đầu & Onboarding
- 📚 Học bài & Bài tập
- 🎤 Luyện Speaking
- ✍️ Luyện Writing
- 📊 Điểm số & Trình độ
- ⚙️ Tài khoản & Cài đặt
- 💰 Gói Pro & Thanh toán

**FAQ Accordion:**
Click category → hiện list câu hỏi phổ biến. Click câu hỏi → expand câu trả lời (có thể bao gồm hình ảnh minh hoạ, video ngắn). Mỗi câu trả lời có nút "Câu này có hữu ích không?" (👍 / 👎) để track quality.

**Không tìm được câu trả lời?**
Banner cuối trang: "Vẫn cần hỗ trợ? → Gửi góp ý cho chúng tôi" (link sang màn hình Góp ý).

---

### Màn hình 10 — Admin Panel

**Bố cục:** Sidebar cố định trái + main content phải. Full height, không có top nav như user.

**Sidebar:**
Header: Logo + "Admin Panel". Nav items: icon + label + badge pending (đỏ cho urgent, vàng cho attention). Active: border trái tím, text tím.

Nav items:
- Dashboard
- Lesson Queue *(badge đỏ: số bài chờ duyệt)*
- Tạo bài học
- Video Manager
- Content Intelligence *(badge vàng: suggestions mới)*
- Reports *(badge đỏ: reports chưa xử lý)*
- User Feedback *(badge vàng: feedback mới)*
- Analytics
- Help Content
- Users

---

**Dashboard:**
Trang tổng quan. 4 metric cards: Tổng users / Bài chờ duyệt / Đã publish / Reports mở. 2 cột preview: "Bài chờ duyệt gần nhất" + "AI suggestions mới nhất".

---

**Lesson Queue:**
List bài chờ admin duyệt. Mỗi row: type badge màu, tiêu đề + meta, level badge, 3 nút hành động.

- **Sửa:** Mở edit mode để chỉnh nội dung câu hỏi, đáp án, tags, level trước khi approve.
- **Từ chối:** Popup nhập lý do. Bài chuyển rejected, có thể generate lại sau.
- **Duyệt:** Bài published ngay, xuất hiện trong Content Library của users. Badge số giảm đi 1.

---

**Video Manager:**
List video từ kênh YouTube theo trạng thái:
- Chờ index → Đang xử lý → Đã index → (Lỗi nếu có)

Mỗi row: thumbnail placeholder, tiêu đề, duration, trạng thái màu. Trigger index lại thủ công cho video bị lỗi.

---

**Content Intelligence:**
AI phân tích data người dùng hàng ngày và đề xuất chủ đề video mới.

Mỗi suggestion card:
- Tiêu đề chủ đề + priority badge (Cao / Trung bình / Thấp)
- Lý do cụ thể từ data thực tế
- Tags skill và level
- Stats minh chứng: số users gặp khó / lần search không có kết quả / số user request
- Nút **"Tạo outline video"** → AI generate script outline ngay để admin dùng khi quay
- Nút **"Bỏ qua"** → dismiss suggestion

---

**Reports:**
List user reports chưa xử lý. Mỗi row: tiêu đề lỗi, reporter + thời gian, bài bị report, nội dung chi tiết. Nút "Xem bài" và "Đã fix".

---

**Analytics:**
Metrics: Sessions / Completion rate / Điểm trung bình / Streak trung bình. Bar chart phân bố level users. Toggle 7 ngày / 30 ngày / 90 ngày.

---

**Tạo bài học thủ công:**
Màn hình để admin tự tay tạo bài học, không phụ thuộc vào pipeline AI từ video. Phù hợp khi muốn tạo bài đặc thù — bài ôn tập, bài theo chủ đề thời sự, bài TOEIC/IELTS mẫu...

Gồm 2 luồng:

*Luồng A — Tạo nhanh:*
Chọn loại bài → Form điền thẳng. Ví dụ chọn "Quiz": hiện form thêm câu hỏi từng cái một (text câu hỏi, 4 options, chọn đáp án đúng, gán skill). Xong → Preview → Publish hoặc Save draft.

*Luồng B — AI hỗ trợ:*
Admin nhập chủ đề + level + loại bài → AI generate nội dung draft → Admin review và chỉnh sửa → Publish. Khác với pipeline video ở chỗ: không cần video, admin chủ động trigger và kiểm soát hoàn toàn chủ đề.

Cả hai luồng đều cần gắn: Level, Type, Tags, Series (optional), trước khi publish.

Preview mode: Hiển thị chính xác bài học sẽ trông như thế nào với user trước khi đẩy lên thư viện.

---

**User Feedback:**
Tổng hợp góp ý người dùng gửi về từ màn hình "Góp ý / Phản hồi". Phân biệt với Reports (lỗi nội dung bài học cụ thể).

Mỗi feedback row: loại góp ý (chip màu), nội dung, user gửi + thời gian, star rating (nếu có), trạng thái (Mới / Đã đọc / Đã xử lý). Nút "Đánh dấu đã đọc" và "Đã xử lý". Filter theo loại, theo trạng thái, theo rating. Feedback có star rating thấp (1-2 sao) được đánh dấu màu để ưu tiên xem.

---

**Help Content:**
Admin quản lý nội dung Help/FAQ xuất hiện trong màn hình hỗ trợ của người dùng.

Giao diện dạng CMS đơn giản: sidebar danh sách categories và articles bên trái, editor bên phải. Admin có thể:
- Thêm / sửa / xoá category
- Thêm / sửa / xoá article trong từng category
- Soạn nội dung bằng rich text editor (có hỗ trợ hình ảnh, video embed)
- Toggle trạng thái published / draft
- Xem tỉ lệ "hữu ích" của từng article (từ 👍/👎 người dùng vote)
- Sắp xếp lại thứ tự hiển thị bằng drag-and-drop

Article có tỉ lệ 👎 cao → highlight để admin xem xét cải thiện.

---

**Users:**
Table: Tên / Level / Streak / Bài đã học / Hoạt động gần nhất. Sort theo từng cột. Click user → xem chi tiết.

---

## 6. User Workflow

### 6.1 Đăng ký và Onboarding lần đầu

```
Vào trang → "Đăng ký" → Điền thông tin hoặc OAuth
    ↓
Bước 1: Chọn mục tiêu học (multi-select, ≥ 1)
    AI dùng thông tin này để tùy chỉnh quiz và lộ trình học
    ↓
Bước 2: Ngành nghề (multi-select) + Thời gian học/ngày (5' / 15' / 30')
    ↓
Bước 3: Placement Quiz (20 câu, adaptive, ~7 phút)
    AI customize câu hỏi theo mục tiêu đã chọn
    Cover 4 skills: Vocab, Grammar, Reading, Listening
    Adaptive: câu sau khó/dễ hơn tùy câu trả lời trước
    Có thể bỏ qua quiz nếu muốn
    ↓
AI xử lý → gán CEFR level → tạo lộ trình học
    ↓
Xem kết quả: level + skill breakdown + mô tả điểm yếu
    ↓
"Bắt đầu học" → Content Library Dashboard
```

### 6.2 Vào học hàng ngày

```
Mở app / vào web → auto đăng nhập
    ↓
Dashboard:
    — Greeting cá nhân hoá + gợi ý bài hôm nay
    — Cập nhật streak và tiến độ tuần
    — "Gợi ý cho bạn": 3 bài AI sắp xếp phù hợp nhất
    ↓
Lựa chọn:
    A) Click bài recommend → học theo AI gợi ý
    B) Browse tất cả → filter theo loại, search theo tên
    C) Tiếp tục bài đang học dở
    ↓
Click bài → Lesson Detail
```

### 6.3 Học bài dạng Video → Quiz

```
Lesson Detail mở ra
    ↓
PHASE 1 — Xem video:
    User click play
    
    Transcript sync realtime:
        Segment đang nói → highlight tím
        Segment đã qua → xám nhạt
        Auto-scroll giữ active segment trong tầm nhìn
    
    User có thể bất kỳ lúc nào:
        Chuyển EN / Song ngữ / VI
        Click đoạn transcript → video seek đến đó
        Tắt auto-scroll để đọc tự do
        Thay đổi tốc độ phát
    ↓
PHASE 2 — Tab Quiz:
    Trả lời câu comprehension từ nội dung video
    Đúng → xanh, tự next
    Sai → đỏ, tùy chọn xem đáp án, bấm next thủ công
    "Nộp bài" → AI Feedback xuất hiện
    ↓
PHASE 3 — Tab Writing (nếu bài có):
    Đọc prompt → viết → nộp
    AI annotate lỗi + chấm điểm từng tiêu chí + gợi ý sửa
    Có thể viết lại và nộp lại
    ↓
PHASE 4 — Tab Speaking (nếu bài có):
    Đọc câu target text
    Thu âm → AI phân tích
    Từng từ hiện chip màu + nhận xét phát âm
    Có thể thu âm lại
    ↓
"Hoàn thành" → Lesson Result
```

### 6.4 Lesson Result và vòng lặp tiếp

```
Lesson Result:
    Điểm tổng + skill delta + AI feedback tổng hợp
    Nhận XP
    [Nếu đủ điều kiện] Level Up animation
    Từ vựng quan trọng bài này
    Streak cập nhật
    ↓
Chọn:
    "Học bài tiếp →" → lesson kế hoặc bài recommend cao nhất
    "Về thư viện" → Dashboard
```

### 6.5 Xem Profile & Progress

```
Click avatar → "Hồ sơ"
    ↓
Xem:
    Level hiện tại + % tiến đến level kế
    Điểm từng kỹ năng + highlight yếu nhất
    Stats tổng hợp
    Calendar heatmap học tập
    Badges đã đạt và đang tiến đến
    Lịch sử bài học gần nhất
```

### 6.6 Report lỗi bài học

```
Phát hiện nội dung sai trong khi học
    ↓
Click icon report (flag) → Popup chọn loại lỗi + mô tả ngắn
    ↓
Submit → toast xác nhận
Admin nhận notification → xử lý → report resolved
```

### 6.7 Cập nhật mục tiêu & kế hoạch học

```
Profile → "Chỉnh sửa mục tiêu"
    HOẶC Settings → "Mục tiêu & Kế hoạch"
    ↓
Chỉnh sửa bất kỳ thứ nào:
    — Mục tiêu học (thêm / bỏ từ 10 options)
    — Ngành nghề (thêm / bỏ)
    — Thời gian học mỗi ngày (5' / 15' / 30')
    — Target level mong muốn
    ↓
Hoặc muốn re-evaluate từ đầu:
    Click "Làm lại placement quiz"
    → Cảnh báo: kết quả mới sẽ ghi đè level hiện tại
    → Xác nhận → vào luồng Quiz như onboarding
    → Kết quả mới được gán, lộ trình học reset theo level mới
    ↓
Click "Lưu thay đổi"
    → Toast xác nhận
    → Recommendation và focus của AI cập nhật từ session tiếp theo
```

### 6.8 Gửi góp ý về hệ thống

```
Mọi màn hình → menu phụ → "Góp ý"
    ↓
Chọn loại: Đề xuất tính năng / Báo lỗi UI / Góp ý nội dung /
           Đánh giá trải nghiệm / Khác
    ↓
Với "Đánh giá trải nghiệm":
    Chọn star rating 1–5
    ↓
Viết nội dung vào textarea
    ↓
Optional: check "Muốn nhận phản hồi" → nhập/xác nhận email
    ↓
Submit → toast cảm ơn → gửi về Admin "User Feedback"
```

### 6.9 Xem Help / FAQ

```
Nav icon ? hoặc "Cần hỗ trợ?" link từ bất kỳ màn hình nào
    ↓
Trang Help mở ra

Nếu biết muốn tìm gì:
    Gõ vào Search → kết quả realtime
    ↓
Nếu muốn browse:
    Click category phù hợp
    Click câu hỏi → expand đáp án
    Vote 👍 / 👎 sau khi đọc
    ↓
Vẫn không tìm được?
    Click "Gửi góp ý" → sang màn hình Góp ý
```

---

## 7. Admin Workflow

### 7.1 Từ video YouTube đến bài học published

Vòng lặp cốt lõi của platform. Mỗi video tạo ra nhiều bài học cho nhiều loại khác nhau.

```
BƯỚC 1 — Admin upload video lên kênh YouTube
    Upload và publish như bình thường
    ↓
BƯỚC 2 — Hệ thống tự phát hiện video mới
    Video xuất hiện trong Video Manager: trạng thái "Chờ index"
    ↓
BƯỚC 3 — Hệ thống tự xử lý (không cần can thiệp)
    Pull transcript (caption YouTube hoặc AI transcribe từ audio)
    AI dịch transcript sang tiếng Việt từng segment
    AI xác định level phù hợp cho nội dung
    AI generate các bài tập:
        — Quiz comprehension (factual + inferential + vocab-in-context)
        — Vocabulary quiz (từ/cụm nổi bật trong video)
        — Writing prompt + sample answer
        — Speaking: chọn câu hay + generate audio mẫu
    
    Video Manager: "Chờ index" → "Đang xử lý" → "Đã index"
    Lesson Queue nhận bài mới, badge số tăng lên
    ↓
BƯỚC 4 — Admin vào Lesson Queue
    Với mỗi bài, kiểm tra:
    
    Quiz:
        Câu hỏi rõ ràng, không mơ hồ?
        Đáp án có đúng không?
        Độ khó phù hợp level đã gán?
    
    Writing:
        Prompt rõ và liên quan nội dung video?
        Sample answer chuẩn?
    
    Speaking:
        Câu có vừa tầm không?
        Audio mẫu nghe tự nhiên không?
    
    Gắn tags trước khi duyệt:
        Level, Category, Series (nếu có)
    
    → "Duyệt" → published, xuất hiện ngay trong thư viện user
    → "Sửa + Duyệt" → chỉnh rồi publish
    → "Từ chối" → nhập lý do, có thể regenerate sau
```

### 7.2 Lên kế hoạch nội dung video qua Content Intelligence

```
Vào "Content Intel" → thấy gợi ý AI

Ví dụ card gợi ý:
    "Nhiều users ở level B1 liên tục fail bài Conditional clauses.
     Chưa có video nào cover chủ đề này ở level B1.
     Nhiều lần search 'conditional sentences' không ra kết quả."
    ↓
Đánh giá từng suggestion:

    Muốn làm video về chủ đề đó?
        Click "Tạo outline video"
        → AI generate: tiêu đề, hook mở đầu, các điểm chính,
          ví dụ cụ thể, câu kết, từ khóa
        Admin dùng outline để quay video
    
    Không phù hợp?
        Click "Bỏ qua" → dismiss
    ↓
Quay video theo outline → upload YouTube → lại từ bước 7.1
```

### 7.3 Xử lý User Reports

```
Badge đỏ tăng ở "Reports" trong sidebar
    ↓
Vào Reports → list report mới
    ↓
Với mỗi report:
    "Xem bài" → mở lesson kiểm tra
    
    Lỗi có thật → sửa nội dung → "Đã fix"
    User hiểu nhầm → "Đã fix" hoặc "Bỏ qua" với ghi chú
```

### 7.4 Theo dõi Analytics

```
Xem Analytics hàng ngày / tuần → ra quyết định nội dung:

Completion rate thấp
    → Bài có thể quá khó → cần thêm bài cấp thấp hơn

Streak trung bình giảm
    → Users mất đà → xem lại tần suất bài mới, chiến lược giữ chân

Nhiều users kẹt ở một level
    → Cần thêm bài cho level đó
    → Content Intel sẽ tự gợi ý chủ đề phù hợp
```

### 7.5 Tạo bài học thủ công

Dùng khi muốn tạo bài đặc thù không đến từ video — bài ôn tập theo chủ đề, bài mẫu TOEIC/IELTS, bài theo sự kiện thời sự, hoặc bài thử nghiệm format mới.

```
Admin Panel → "Tạo bài học" (nút hoặc menu riêng)
    ↓
Chọn loại bài: Quiz / Writing / Speaking / Audio → Quiz
    ↓
LUỒNG A — Tạo thủ công hoàn toàn:
    Điền từng phần nội dung theo loại bài:
    
    Quiz:
        Thêm câu hỏi lần lượt
        Mỗi câu: text câu hỏi, 4 options, chọn đáp án đúng, gán skill
        Nút "+ Thêm câu" để thêm tiếp
    
    Writing:
        Nhập prompt
        Nhập sample answer (để AI dùng làm tham chiếu khi chấm)
        Đặt giới hạn số từ nếu cần
    
    Speaking:
        Nhập câu target text
        Record hoặc upload audio mẫu
        Hoặc để AI generate audio TTS từ câu text
    
    Gắn metadata: Level, Tags, Series (optional), Category
    ↓
LUỒNG B — AI hỗ trợ tạo draft:
    Nhập: Chủ đề + Level + Loại bài + Ghi chú thêm (optional)
    → AI generate toàn bộ nội dung draft
    → Admin xem preview, chỉnh sửa từng phần
    → Gắn metadata → Publish
    ↓
Preview mode (cả 2 luồng):
    Xem bài sẽ hiển thị với user như thế nào trước khi publish
    ↓
Publish → bài vào Content Library ngay
HOẶC Save draft → lưu để chỉnh sửa sau
```

### 7.6 Xem và xử lý User Feedback

```
Sidebar → "User Feedback" (badge vàng khi có feedback mới)
    ↓
Thấy list feedback từ users, có thể:
    Filter theo loại (Đề xuất / Báo lỗi UI / Góp ý nội dung / Đánh giá / Khác)
    Filter theo trạng thái (Mới / Đã đọc / Đã xử lý)
    Sort theo rating (thấp nhất lên đầu để ưu tiên xử lý)
    ↓
Với feedback quan trọng:
    Đọc nội dung chi tiết
    Nếu là đề xuất tính năng → ghi nhận, đưa vào backlog
    Nếu là báo lỗi UI → chuyển sang dev fix
    Nếu user để lại email và muốn phản hồi → reply trực tiếp
    ↓
Mark "Đã xử lý" → xoá khỏi danh sách pending
```

### 7.7 Quản lý Help Content

```
Sidebar → "Help Content"
    ↓
Thấy danh sách categories và articles hiện có
Xem tỉ lệ 👍/👎 của từng article
    → Article 👎 nhiều → cần cải thiện nội dung
    ↓
Thêm article mới:
    Chọn / tạo category
    Nhập tiêu đề câu hỏi
    Soạn nội dung (rich text, có thể chèn ảnh, video)
    Toggle: Draft → Published
    ↓
Sửa article có sẵn:
    Click article → edit mode
    Cập nhật nội dung → Save
    ↓
Sắp xếp lại thứ tự:
    Drag-and-drop articles trong category
    Drag-and-drop categories
```

---

## 8. Content Pipeline

```
Kênh YouTube (video mới)
    │
    ↓ Hệ thống tự phát hiện
    │
    ├─► Lấy transcript (caption YouTube hoặc AI transcribe)
    ├─► AI dịch transcript EN → VI từng segment
    │       Kết quả: [{thời gian bắt đầu, kết thúc, nội dung EN, nội dung VI}]
    ├─► AI xác định level nội dung
    └─► AI generate bài tập các loại
            │
            ↓ Vào hàng chờ duyệt
            │
    Admin Review → Approve / Edit+Approve / Reject
            │
            ↓ Published
            │
    Xuất hiện trong Content Library
            │
    Hệ thống cập nhật recommendation score định kỳ
    (dựa trên lượt học, tỉ lệ hoàn thành, độ mới, trending)
```

### Transcript — Cấu trúc dữ liệu

Mỗi đoạn transcript lưu thông tin: thời điểm bắt đầu và kết thúc trong video (tính bằng giây), nội dung tiếng Anh gốc, và bản dịch tiếng Việt tương ứng. Thông tin thời gian được dùng để sync highlight transcript với video đang phát realtime trên client.

---

## 9. AI trong hệ thống

AI tham gia vào hầu hết quy trình của platform. Được thiết kế theo nguyên tắc **dễ thay thế**: khi có model mới tốt hơn, chỉ cần cập nhật ở tầng tích hợp mà không ảnh hưởng logic nghiệp vụ.

### Tạo nội dung
- Transcribe audio video thành text khi không có caption
- Dịch transcript tiếng Anh sang tiếng Việt từng segment
- Tạo câu hỏi comprehension từ nội dung video
- Tạo writing prompt và sample answer
- Chọn câu hay từ transcript làm bài speaking, generate audio đọc mẫu
- Đề xuất chủ đề video mới cho admin dựa trên data người dùng
- Tạo outline script cho video sắp quay

### Đánh giá người học
- Tùy chỉnh câu hỏi placement quiz theo mục tiêu và ngành nghề
- Xác định CEFR level từ kết quả placement quiz
- Chấm điểm writing theo tiêu chí phù hợp level (Grammar, Vocabulary; thêm Coherence từ B1; thêm Style từ C1)
- Transcribe giọng đọc của người dùng trong bài speaking
- Phân tích lỗi phát âm từng từ, so sánh với câu mẫu
- Đưa ra nhận xét và gợi ý cụ thể sau mỗi bài

### Cá nhân hoá
- Tính recommendation score cho mỗi bài theo từng user cụ thể
- Điều chỉnh lộ trình khi level thay đổi
- Tổng hợp feedback sau mỗi bài học

---

## 10. Monetization

### Giai đoạn 1 — Grow user base
Tập trung hoàn thiện sản phẩm và tích lũy người dùng. Chưa thu tiền. Ưu tiên retention và word-of-mouth.

### Giai đoạn 2 — Freemium
Khi nền tảng đã có lượng user ổn định:

| Tính năng | Free | Pro |
|---|---|---|
| Bài học mỗi ngày | Giới hạn | Không giới hạn |
| Quiz & Reading | ✅ | ✅ |
| AI Writing Feedback | Cơ bản | Chi tiết + gợi ý sửa cụ thể |
| Speaking Scoring | ❌ | ✅ |
| Mock TOEIC / IELTS | ❌ | ✅ |

### Giai đoạn 3 — B2B
Bán license cho công ty có nhân viên cần tiếng Anh. HR có dashboard riêng theo dõi progress toàn team. Gói theo số lượng tài khoản, ticket size lớn hơn nhiều so với individual subscription.