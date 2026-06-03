# Chinese4VN - UI/UX Design Document

## Tổng quan luồng điều hướng

```
Splash Screen
    │
    ├── (chưa đăng nhập) → Auth Screen (Login / Register)
    │                            │
    │                            └── (chưa onboarding) → Onboarding Wizard
    │                                                      │
    │                                                      └── → Home
    │
    └── (đã đăng nhập) → Home
                            │
                   ┌───────┼────────┐
                   │       │        │
                Home    Review   Profile
                   │       │
                   │       └── Review Session (Flashcard)
                   │
                   └── Learning Path (Level Detail)
                            │
                            └── Lesson Player
                                    │
                                    ├── Tab: Từ mới (Vocab)
                                    ├── Tab: Ngữ pháp (Grammar)
                                    └── Tab: Luyện tập (Practice)
                                          │
                                          └── Kết quả bài học
```

---

## 1. Màn hình: Splash / Loading

### Mô tả
Màn hình khởi động khi mở app, kiểm tra trạng thái đăng nhập.

### Layout

```
┌─────────────────────────────┐
│                             │
│                             │
│         [Logo App]          │  ← Icon app + tên (Chinese4VN)
│                             │
│     Học tiếng Trung         │  ← Tagline
│     Hiệu quả hơn            │
│                             │
│                             │
│     ─────────────           │  ← Loading indicator
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

### Thành phần
- Logo app (trung tâm)
- Tên app + tagline
- Loading spinner / progress bar
- Auto-redirect sau khi kiểm tra token

---

## 2. Màn hình: Auth (Login / Register)

### Mô tả
Cho phép người dùng đăng nhập hoặc đăng ký tài khoản.

### Layout

```
┌─────────────────────────────┐
│                             │
│  👋  Chào bạn!              │
│  Đăng nhập để tiếp tục      │
│                             │
│  ┌─────────────────────┐    │
│  │ Email                │    │  ← TextInput
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Mật khẩu             │    │  ← TextInput (secure)
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │   ĐĂNG NHẬP          │    │  ← Button primary (full width)
│  └─────────────────────┘    │
│                             │
│  ──── Hoặc tiếp tục với ────│
│                             │
│  [Google]  [Facebook]       │  ← Social login buttons
│                             │
│  Chưa có tài khoản?         │
│  Đăng ký                    │  ← Link → chuyển sang form Register
│                             │
└─────────────────────────────┘
```

### States
| State | Hiển thị |
|-------|---------|
| **Default** | Form đăng nhập |
| **Loading** | Button disabled, spinner |
| **Error** | Error message dưới form (màu đỏ) |
| **Success** | Redirect → Onboarding hoặc Home |
| **Toggle Register** | Đổi thành form đăng ký (thêm field: Tên hiển thị, Xác nhận mật khẩu) |

---

## 3. Màn hình: Onboarding Wizard

### Mô tả
Hướng dẫn người dùng mới thiết lập mục tiêu học tập. Gồm 2-3 bước.

### Bước 1: Chọn lộ trình

```
┌─────────────────────────────┐
│                             │
│  Bạn muốn học như thế nào?  │
│                             │
│  ┌─────────────────────┐    │
│  │ 🆕  Học mới          │    │  ← Card chọn track
│  │  Học từ đầu, theo    │    │
│  │  giáo trình HSK      │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ⚡  Học nhanh         │    │  ← Card chọn track
│  │  Ôn tập cấp tốc,     │    │
│  │  tập trung từ vựng   │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔁  Ôn tập           │    │  ← Card chọn track
│  │  Dành cho người đã   │    │
│  │  biết tiếng Trung    │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  TIẾP TỤC            │    │  ← Button (disabled nếu chưa chọn)
│  └─────────────────────┘    │
│                             │
│  1 ● ── ○ ── ○              │  ← Step indicator
└─────────────────────────────┘
```

### Bước 2: Chọn cấp độ & mục tiêu

```
┌─────────────────────────────┐
│                             │
│  Bạn muốn đạt HSK mấy?      │
│                             │
│  ○ HSK 1 (150 từ)           │  ← Radio list
│  ○ HSK 2 (300 từ)           │
│  ● HSK 3 (600 từ)           │  ← Selected
│  ○ HSK 4 (1200 từ)          │
│  ○ HSK 5 (2500 từ)          │
│  ○ HSK 6 (5000+ từ)         │
│                             │
│  Mục tiêu mỗi ngày:         │
│  ┌─────────────────────┐    │
│  │ 15 phút / ngày       │    │  ← Picker / Slider
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  HOÀN THÀNH          │    │  ← Button primary
│  └─────────────────────┘    │
│                             │
│  ○ ── ○ ● ── ○              │  ← Step indicator
└─────────────────────────────┘
```

---

## 4. Màn hình: Home (Dashboard)

### Mô tả
Trang chủ chính, hiển thị tổng quan tiến độ, gợi ý ôn tập, và truy cập nhanh.

### Layout

```
┌─────────────────────────────┐
│  ┌──────────────────────┐   │
│  │  Chào, Nguyễn!     🔔│   │  ← Header: greeting + notification bell
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  🔥 7 ngày           │   │  ← Streak card
│  │  ⭐ 1,250 XP         │   │
│  │  📊 85% hoàn thành   │   │
│  └──────────────────────┘   │
│                             │
│  ┌─ Ôn tập hôm nay ──────┐ │
│  │ 📝 12 từ cần ôn       │ │  ← Review banner (CARD nổi bật)
│  │                        │ │
│  │ [    ÔN TẬP NGAY    ] │ │  ← Button
│  └────────────────────────┘ │
│                             │
│  ┌── Học tiếp ────────────┐│
│  │ 📖 Bài 3: 你叫什么名字  ││  ← Continue learning card
│  │  ████████░░ 70%       ││     (lesson đang học dở)
│  │                        ││
│  │ [    TIẾP TỤC        ]││  ← Button
│  └────────────────────────┘│
│                             │
│  Tiến độ HSK               │
│  ┌──┬──┬──┬──┬──┬──┐      │  ← Grid 3x2: HSK 1-6
│  │1 │2 │3 │4 │5 │6 │      │     Mỗi ô: level + progress ring
│  │★ │★ │★░│░░│░░│░░│      │
│  └──┴──┴──┴──┴──┴──┘      │
│                             │
│  ─────────────               │
│  [🏠]    [🔄]    [👤]       │  ← Tab bar (Home / Review / Profile)
└─────────────────────────────┘
```

### Thành phần chi tiết
| Component | Mô tả |
|-----------|-------|
| **StreakCard** | Icon lửa + số ngày streak, tổng XP, % hoàn thành hôm nay |
| **ReviewBanner** | Card gradient, số lượng từ cần ôn hôm nay, button "Ôn tập ngay" |
| **ContinueCard** | Bài học đang dở dang, progress bar, button tiếp tục |
| **HskGrid** | Grid 2x3 hoặc 3x2, mỗi ô là CircularProgress với icon, màu sắc theo trạng thái (locked/in progress/completed) |
| **QuickActions** | (Tùy chọn) Các nút: Tra từ điển, Luyện viết chữ... |

### States
| State | Hiển thị |
|-------|---------|
| **Default** | Đầy đủ thông tin |
| **New user (chưa có data)** | Ẩn review + continue, hiện "Bắt đầu học ngay" |
| **No review due** | Review banner ẩn hoặc hiện "Bạn đã ôn xong! 🎉" |
| **Loading** | Skeleton loading |

---

## 5. Màn hình: Learning Path (Level Detail)

### Mô tả
Hiển thị chi tiết một cấp độ HSK, danh sách các Unit và Lesson.

### Layout

```
┌─────────────────────────────┐
│  ←  HSK 2                   │  ← Header + back button
│                             │
│  ┌──────────────────────┐   │
│  │  Tiến độ: 15/30 bài   │   │  ← Tổng quan level
│  │  ████████░░░░░░░  50% │   │
│  │  ⭐ 450 XP           │   │
│  └──────────────────────┘   │
│                             │
│  Unit 1: 我的一天           │  ← Section header
│  ┌──────────────────────┐   │
│  │  📘 Bài 1: 起床      │   │  ← Lesson card
│  │  ██████████ 100%     │   │     (completed - có checkmark)
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │  📘 Bài 2: 吃饭      │   │  ← Lesson card
│  │  ████░░░░░░ 40%      │   │     (in progress)
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │  📘 Bài 3: 上学      │   │  ← Lesson card
│  │  ░░░░░░░░░░ 0%       │   │     (locked hoặc available)
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │  🏆 Bài kiểm tra     │   │  ← Boss lesson (đặc biệt)
│  │  (Unit 1 Review)     │   │
│  └──────────────────────┘   │
│                             │
│  Unit 2: 我的家人           │  ← Section header
│  ┌──────────────────────┐   │
│  │  🔒 Bài 4: 爸爸      │   │  ← Locked lesson
│  └──────────────────────┘   │
│  ...                        │
└─────────────────────────────┘
```

### Thành phần
| Component | Mô tả |
|-----------|-------|
| **LevelHeader** | Tên level, progress bar tổng, tổng XP |
| **UnitSection** | Tên unit, có thể expand/collapse |
| **LessonCard** | Icon + tên lesson, progress bar, trạng thái (locked/available/in-progress/completed) |
| **BossLesson** | Bài kiểm tra cuối unit, icon cúp, màu vàng |
| **LockedOverlay** | Lesson bị khóa (hiển thị icon ổ khóa) |

---

## 6. Màn hình: Lesson Player

### Mô tả
Màn hình học chính. Gồm 3 tab: Từ mới → Ngữ pháp → Luyện tập.

### Layout tổng thể

```
┌─────────────────────────────┐
│  ←  Bài 2: 吃饭      ⭐ +15│  ← Header: back + title + XP reward
│                             │
│  [Từ mới] [Ngữ pháp] [Bài tập]│  ← Tab bar (3 tabs)
│                             │
│  ───────────────────────    │
│                             │
│     (Nội dung tab)          │  ← Nội dung thay đổi theo tab
│                             │
│                             │
│                             │
│                             │
│                             │
│  ───────────────────────    │
│  [      TIẾP TỤC        ]  │  ← Button (chuyển bước / tab)
└─────────────────────────────┘
```

### Tab 1: Từ mới (Vocabulary)

```
┌─────────────────────────────┐
│  ←  Bài 2: 吃饭      ⭐ +15│
│  [Từ mới] [Ngữ pháp] [Bài tập]│
│                             │
│  📖 Từ mới trong bài (5 từ) │
│                             │
│  ┌──────────────────────┐   │
│  │     吃饭              │   │  ← Flashcard lớn (giữa màn hình)
│  │     chī fàn           │   │     Tap để lật
│  │                      │   │
│  │  ─────────────       │   │
│  │   Ăn cơm             │   │  ← Hiển thị sau khi lật
│  │                      │   │
│  │  🔊                  │   │  ← Button audio
│  └──────────────────────┘   │
│                             │
│  ● ● ○ ○ ○                  │  ← Dots indicator (5 từ)
│                             │
│  [  ◀  ]    [ ▶  ]         │  ← Prev / Next
│                             │
│  ┌──────────────────────┐   │
│  │  TIẾP TỤC            │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Tab 2: Ngữ pháp (Grammar)

```
┌─────────────────────────────┐
│  ←  Bài 2: 吃饭      ⭐ +15│
│  [Từ mới] [Ngữ pháp] [Bài tập]│
│                             │
│  📖 Ngữ pháp trong bài      │
│                             │
│  ┌──────────────────────┐   │
│  │   📝 Cấu trúc:        │   │
│  │   Subject + 吃 + Noun │   │  ← Grammar card
│  │                      │   │
│  │  "Tôi ăn cơm"        │   │
│  │  → 我吃饭             │   │
│  │                      │   │
│  │  🔊 Ví dụ: 我吃饭。  │   │  ← Audio
│  │   wǒ chī fàn         │   │
│  └──────────────────────┘   │
│                             │
│  ● ○ ○                      │  ← Dots indicator
│                             │
│  ┌──────────────────────┐   │
│  │  TIẾP TỤC            │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Tab 3: Luyện tập (Practice / Quiz)

Ở tab này, mỗi bước là một dạng câu hỏi khác nhau:

#### Dạng 1: Chọn nghĩa đúng (Meaning Select)
```
┌─────────────────────────────┐
│  ←  Bài 2          3/8 câu │  ← Progress
│  [Từ mới] [Ngữ pháp] [Bài tập]│
│                             │
│  🔊 "wǒ chī fàn"           │  ← Audio + hanzi (tùy dạng)
│                             │
│  Dịch sang tiếng Việt:     │  ← Prompt
│                             │
│  ┌──────────────────────┐   │
│  │ 🅰 Tôi học bài       │   │  ← Option card
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🅱 Tôi ăn cơm        │   │  ← Option card (đáp án đúng)
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🅲 Tôi uống nước     │   │  ← Option card
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🅳 Tôi đi làm        │   │  ← Option card
│  └──────────────────────┘   │
│                             │
│  Correct! 🎉                │  ← Feedback (sau khi chọn)
│  "吃饭" = "ăn cơm"          │
└─────────────────────────────┘
```

#### Dạng 2: Chọn Hán tự đúng (Hanzi Select)
```
┌─────────────────────────────┐
│  →  "ăn cơm"               │  ← Nghĩa tiếng Việt
│                             │
│  Chọn Hán tự đúng:         │
│                             │
│  ┌─────────┐  ┌─────────┐  │
│  │  吃饭    │  │  喝水    │  │  ← Grid 2x2
│  └─────────┘  └─────────┘  │
│  ┌─────────┐  ┌─────────┐  │
│  │  睡觉    │  │  走路    │  │
│  └─────────┘  └─────────┘  │
└─────────────────────────────┘
```

#### Dạng 3: Nghe và chọn (Listening)
```
┌─────────────────────────────┐
│  🔊 (Nghe audio)            │  ← Button play audio (có thể auto-play)
│  ◉━━━━━━━━━◉               │  ← Progress bar audio
│                             │
│  Bạn nghe được gì?         │
│                             │
│  ┌──────────────────────┐   │
│  │  你叫什么名字         │   │  ← Option
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │  你吃了吗             │   │  ← Option
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │  你去哪里             │   │  ← Option
│  └──────────────────────┘   │
└─────────────────────────────┘
```

#### Dạng 4: Sắp xếp câu (Arrange Sentence)
```
┌─────────────────────────────┐
│  Sắp xếp thành câu đúng:   │
│  "Tôi ăn cơm"              │
│                             │
│  ┌──────────────────────┐   │
│  │  饭  吃  我            │   │  ← Các từ để sắp xếp (drag hoặc tap)
│  └──────────────────────┘   │
│                             │
│  Câu của bạn:              │
│  ┌──────────────────────┐   │
│  │  我  ＿  ＿            │   │  ← Drop zone / chỗ trống
│  └──────────────────────┘   │
│                             │
│  [  KIỂM TRA  ]            │  ← Button
└─────────────────────────────┘
```

#### Dạng 5: Nhập pinyin
```
┌─────────────────────────────┐
│  Nhập pinyin cho từ sau:   │
│                             │
│       吃饭                  │  ← Hanzi
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │  ← TextInput (pinyin)
│  └──────────────────────┘   │
│                             │
│  Gợi ý: ch... f...         │  ← Hint (sau 5s)
│                             │
│  [  KIỂM TRA  ]            │
└─────────────────────────────┘
```

### Màn hình: Kết quả bài học

```
┌─────────────────────────────┐
│                             │
│      🎉  Hoàn thành!       │
│                             │
│  ⭐ +15 XP                  │  ← XP earned
│                             │
│  ┌──────────────────────┐   │
│  │  📊 Kết quả:          │   │
│  │  Đúng: 6/8 câu       │   │
│  │  ████████░░ 75%      │   │
│  └──────────────────────┘   │
│                             │
│  📝 Từ đã sai:              │
│  吃饭 → "ăn cơm"           │  ← Review từ sai
│  睡觉 → "ngủ"              │
│                             │
│  ┌──────────────────────┐   │
│  │  📖 HỌC BÀI TIẾP     │   │  ← Button primary
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │  🔄 ÔN LẠI           │   │  ← Button outline
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │  🏠 VỀ TRANG CHỦ     │   │  ← Button ghost
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Thành phần Lesson Player
| Component | Mô tả |
|-----------|-------|
| **LessonHeader** | Back button, tên bài, XP reward indicator |
| **TabBar** | 3 tab: Từ mới / Ngữ pháp / Bài tập |
| **VocabFlashcard** | Card to, tap lật, hiển thị hanzi/pinyin/nghĩa, audio button, prev/next, dots |
| **GrammarCard** | Giải thích cấu trúc, ví dụ, audio |
| **QuizQuestion** | Khung chứa câu hỏi (thay đổi theo type) |
| **OptionCard** | Card chọn đáp án (có feedback màu xanh/đỏ, animation) |
| **ProgressIndicator** | "3/8 câu" |
| **FeedbackOverlay** | Correct (xanh + check) / Incorrect (đỏ + giải thích) |
| **ResultScreen** | Điểm, XP, danh sách từ sai, các nút điều hướng |

---

## 7. Màn hình: Review (SRS Ôn tập)

### Mô tả
Ôn tập từ vựng theo spaced repetition (SM-2). Giao diện flashcard.

### Màn hình danh sách review (tab Review khi chưa bắt đầu)

```
┌─────────────────────────────┐
│                             │
│     🔄  Ôn tập hôm nay      │
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │     📝 12 từ cần ôn   │   │  ← Card to, số lượng
│  │                      │   │
│  │  [  BẮT ĐẦU  ]      │   │  ← Button
│  │                      │   │
│  └──────────────────────┘   │
│                             │
│  Thống kê hôm qua:         │
│  ✅ 15 từ đã ôn             │
│  ⭐ 30 XP                   │
│                             │
└─────────────────────────────┘
```

### Màn hình flashcard review

```
┌─────────────────────────────┐
│  🔄 3/12                    │  ← Header + progress
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │      吃饭             │   │  ← Flashcard (mặt trước: hanzi)
│  │                      │   │
│  │  👆 Chạm để lật      │   │
│  │                      │   │
│  └──────────────────────┘   │
│                             │
│         (Sau khi lật)       │
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │   吃饭 chī fàn        │   │  ← Mặt sau: pinyin + nghĩa
│  │   Ăn cơm             │   │
│  │                      │   │
│  │  🔊                  │   │  ← Audio
│  └──────────────────────┘   │
│                             │
│  Bạn nhớ từ này chứ?       │
│                             │
│  [😞 Quên] [🤔 Phân vân] [😊 Dễ]│  ← 3 nút đánh giá
│    (0)       (3)        (5)     SM-2 quality
│                             │
│  ─────────────               │
│  [🏠]    [🔄]    [👤]       │
└─────────────────────────────┘
```

### Màn hình kết quả review

```
┌─────────────────────────────┐
│                             │
│     🎉  Ôn tập xong!       │
│                             │
│  Bạn đã ôn 12 từ            │
│  ✅ Đúng: 10                │
│  ❌ Sai: 2                  │
│  ⭐ +24 XP                  │
│                             │
│  🔥 Streak: 7 ngày!         │
│                             │
│  ┌──────────────────────┐   │
│  │  🏠 VỀ TRANG CHỦ     │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Thành phần
| Component | Mô tả |
|-----------|-------|
| **ReviewStartCard** | Số lượng từ cần ôn, button bắt đầu |
| **Flashcard** | Tap to flip, animation lật 3D, audio |
| **RatingButtons** | 3 nút: Quên (0) / Phân vân (3) / Dễ (5) — khác màu sắc |
| **ReviewProgress** | "3/12", progress bar |
| **ReviewResult** | Thống kê sau khi ôn xong |

---

## 8. Màn hình: Profile

### Mô tả
Thông tin người dùng, thống kê tiến độ, và cài đặt.

### Layout

```
┌─────────────────────────────┐
│                             │
│  ┌──────────────────────┐   │
│  │    [Avatar]           │   │  ← Avatar + tên
│  │    Nguyễn Văn A      │   │
│  │    ⭐ Level 3         │   │
│  └──────────────────────┘   │
│                             │
│  Thống kê                   │
│  ┌──────┬──────┬──────┐     │  ← 3 stat cards
│  │📖 150│📝 45 │🔥 7  │     │
│  │Từ vựng|Bài học|Streak│   │
│  └──────┴──────┴──────┘     │
│                             │
│  Kỹ năng                    │
│  ┌──────────────────────┐   │
│  │ Từ vựng  ████████ 80%│   │  ← Skill bars
│  │ Ngữ pháp ██████░ 60%│   │
│  │ Nghe     ███████░ 70%│   │
│  │ Đọc      ██████░░ 55%│   │
│  └──────────────────────┘   │
│                             │
│  Tiến độ HSK                │
│  HSK 1 ✅     HSK 2 ✅      │  ← Level badges
│  HSK 3 🔄 60% HSK 4 🔒    │
│                             │
│  Cài đặt                    │
│  ┌──────────────────────┐   │
│  │ 👤 Thông tin         │   │  ← Setting items
│  ├──────────────────────┤   │
│  │ 🔔 Thông báo         │   │
│  ├──────────────────────┤   │
│  │ 🌐 Ngôn ngữ          │   │
│  ├──────────────────────┤   │
│  │ 📊 Mục tiêu học tập  │   │
│  ├──────────────────────┤   │
│  │ ℹ️ Về ứng dụng       │   │
│  ├──────────────────────┤   │
│  │ 🚪 Đăng xuất         │   │
│  └──────────────────────┘   │
│                             │
└─────────────────────────────┘
```

---

## 9. Feature: Tra từ điển (Dictionary) — đề xuất bổ sung

### Mô tả
Tra cứu từ vựng, xem chi tiết từ (pinyin, nghĩa, ví dụ, bộ thủ, nét chữ).

```
┌─────────────────────────────┐
│  ← Tra từ                   │
│                             │
│  ┌──────────────────────┐   │
│  │ 🔍  Nhập từ...       │   │  ← Search bar
│  └──────────────────────┘   │
│                             │
│  Gợi ý:                     │
│  ┌──────────────────────┐   │
│  │ 你好 (nǐ hǎo) - xin chào│  ← Search result item
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 吃饭 (chī fàn) - ăn cơm│
│  └──────────────────────┘   │
│                             │
│  (Sau khi chọn 1 từ)        │
│                             │
│  ┌──────────────────────┐   │
│  │      吃饭             │   │  ← Từ chi tiết
│  │      chī fàn          │   │
│  │      Ăn cơm          │   │
│  │      Động từ          │   │
│  │                      │   │
│  │  🔊 🔖 📝            │   │  ← Audio + Bookmark + Note
│  └──────────────────────┘   │
│                             │
│  📖 Ví dụ:                  │
│  我在吃饭。 (Wǒ zài chī fàn.)│
│  "Tôi đang ăn cơm"         │
│                             │
│  ✍️ Bộ thủ: 口 (khẩu)      │
│  Số nét: 6                 │
│                             │
│  [➕ Thêm vào ôn tập]       │  ← Button
└─────────────────────────────┘
```

---

## 10. Feature: Luyện viết chữ (Handwriting) — đề xuất bổ sung

```
┌─────────────────────────────┐
│  ← Luyện viết     🔇 🔊    │
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │      你              │   │  ← Chữ mẫu (có hiệu ứng thứ tự nét)
│  │     (nǐ)             │   │
│  │      bạn             │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │    (Vùng viết tay)   │   │  ← Canvas vẽ chữ
│  │                      │   │
│  │                      │   │
│  └──────────────────────┘   │
│                             │
│  [🔄 Làm lại]  [✅ Kiểm tra]│  ← Actions
│                             │
│   Độ chính xác: 85%        │  ← Score (sau khi kiểm tra)
│                             │
│  ◀ ▶                        │  ← Chuyển chữ
└─────────────────────────────┘
```

---

## 11. Feature: Mock Test (Thi thử HSK) — đề xuất bổ sung

### Màn hình bắt đầu thi

```
┌─────────────────────────────┐
│  ←  Bài thi thử HSK 2      │
│                             │
│  ⏱ Thời gian: 60 phút      │
│  📝 Số câu: 50 câu          │
│  📊 Cấu trúc:               │
│     - Nghe: 20 câu          │
│     - Đọc: 20 câu           │
│     - Viết: 10 câu          │
│                             │
│  🎯 Điểm đỗ: 60%            │
│                             │
│  ┌──────────────────────┐   │
│  │  BẮT ĐẦU LÀM BÀI    │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Màn hình làm bài thi

```
┌─────────────────────────────┐
│  ⏱ 45:32    ⚪⚪⚫⚪⚪ 4/50  │  ← Timer + progress dots
│                             │
│  Phần 1: Nghe               │
│                             │
│  🔊 ████████░░              │  ← Audio player
│                             │
│  Câu 4:                     │
│  Người nói đang làm gì?    │
│                             │
│  ┌──────────────────────┐   │
│  │ 🅰 Ăn cơm            │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🅱 Học bài            │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ 🅲 Đi ngủ             │   │
│  └──────────────────────┘   │
│                             │
│  ◀──── ────▶               │  ← Prev / Next
└─────────────────────────────┘
```

---

## 12. Feature: Social (Bảng xếp hạng, Bạn bè) — đề xuất bổ sung

### Bảng xếp hạng

```
┌─────────────────────────────┐
│  ←  Bảng xếp hạng           │
│                             │
│  [Hôm nay] [Tuần] [Tháng]  │  ← Tab time filter
│                             │
│  🥇  Nguyễn Văn A   450 XP │  ← Top 1
│  🥈  Trần Thị B     380 XP │  ← Top 2
│  🥉  Lê Văn C       320 XP │  ← Top 3
│                             │
│   4  Phạm Thị D     290 XP │
│   5  Hoàng Văn E    250 XP │
│  ...                        │
│                             │
│  ─── Bạn ───                │
│  👤  Bạn             120 XP │  ← User's rank (nổi bật)
└─────────────────────────────┘
```

---

## Tổng hợp các thành phần UI

### Component Tree tổng thể

```
App
├── Layout Components
│   ├── SafeArea
│   ├── CustomHeader (back, title, actions)
│   └── TabBar (3 tabs chính)
│
├── Auth
│   ├── LoginForm
│   └── RegisterForm
│
├── Onboarding
│   ├── TrackSelector (Học mới / Học nhanh / Ôn tập)
│   ├── LevelSelector (HSK 1-6)
│   └── GoalPicker (thời gian/ngày)
│
├── Home
│   ├── StreakCard (streak, XP, progress)
│   ├── ReviewBanner (số từ cần ôn, button)
│   ├── ContinueCard (bài đang học dở)
│   └── HskGrid (grid 3x2, mỗi ô là level ring)
│
├── LearningPath
│   ├── LevelHeader (progress bar tổng)
│   ├── UnitSection (group lessons)
│   ├── LessonCard (tên, progress, trạng thái)
│   └── BossLesson (review cuối unit)
│
├── LessonPlayer
│   ├── LessonHeader
│   ├── TabBar (3 tabs)
│   ├── VocabFlashcard (tap to flip, audio, prev/next)
│   ├── GrammarCard (cấu trúc, ví dụ)
│   ├── QuizQuestion
│   │   ├── MeaningSelect
│   │   ├── HanziSelect
│   │   ├── ListeningChoice
│   │   ├── ArrangeSentence
│   │   └── PinyinInput
│   ├── OptionCard (có feedback)
│   └── ResultScreen (điểm, XP, từ sai)
│
├── ReviewSession
│   ├── ReviewStartCard
│   ├── Flashcard (tap flip, 3D animation)
│   ├── RatingButtons (Quên / Phân vân / Dễ)
│   └── ReviewResult
│
├── Profile
│   ├── UserInfoCard (avatar, tên, level)
│   ├── StatsRow (3 stat cards)
│   ├── SkillBars (4 skills)
│   ├── HskBadges
│   └── SettingsList
│
├── Dictionary (future)
│   ├── SearchBar
│   ├── SearchResultItem
│   └── WordDetail (pinyin, nghĩa, ví dụ, bộ thủ)
│
├── Handwriting (future)
│   ├── CharDisplay (mẫu chữ + thứ tự nét)
│   ├── DrawingCanvas (vùng viết)
│   └── AccuracyScore
│
├── MockTest (future)
│   ├── TestStartCard
│   ├── TestQuestion
│   └── TestResult
│
└── Social (future)
    ├── Leaderboard
    ├── FriendList
    └── ChallengeCard
```

### Design System gợi ý

Tone đã chốt: C - cam san hô + teal + nền kem. Mục tiêu là giữ giao diện ấm, trẻ, rõ trạng thái học tập và đủ mềm để đọc lâu không mỏi mắt.

| Token | Giá trị | Ghi chú |
|-------|---------|---------|
| **Primary** | `#FF7A59` | Cam san hô — CTA, nhấn mạnh hành động |
| **Secondary** | `#0F766E` | Teal đậm — tin cậy, điều hướng, tab |
| **Accent** | `#14B8A6` | Teal sáng — highlight nhẹ, badge |
| **Success** | `#2ECC71` | Xanh lá — đúng, hoàn thành |
| **Error** | `#E74C3C` | Đỏ — sai, lỗi |
| **Warning** | `#F39C12` | Vàng — cảnh báo, trung bình |
| **Background** | `#FFF8F1` | Nền kem rất nhạt |
| **Surface** | `#FFFFFF` | Trắng |
| **Text** | `#24303F` | Xám xanh đậm |
| **TextSecondary** | `#667085` | Xám xanh nhạt |
| **BorderRadius** | `12` | Bo góc mềm |
| **CardElevation** | `shadow` (iOS) / `elevation: 4` (Android) | Đổ bóng nhẹ, không nặng |

### Hướng triển khai tone C
- Dùng cam san hô cho CTA chính và các trạng thái đang học.
- Dùng teal cho header, tab, badge, progress phụ và các thành phần điều hướng.
- Dùng nền kem thay vì nền trắng tuyệt đối để app ấm hơn nhưng vẫn sạch.
- Giữ màu xanh lá, đỏ, vàng chỉ cho feedback trạng thái để không phá palette chính.
- Ưu tiên gradient cam sang teal ở banner, splash, review card và các vùng cần tạo điểm nhấn.

### Animation gợi ý
- **Chuyển tab**: Slide ngang
- **Flashcard lật**: Rotate Y 180 độ (3D)
- **Option chọn**: Scale nhẹ khi tap, feedback xanh/đỏ fade in
- **Progress bar**: Animated width với easing
- **List**: Stagger animation khi vào màn hình
- **XP nhận**: Number counting animation + particle effect

---

> **Ghi chú**: Tài liệu này mô tả UI/UX lý tưởng dựa trên kiến trúc hiện tại. Các màn hình đã được implement có thể chưa đầy đủ 100% so với thiết kế này — đây là vision để phát triển tiếp.
