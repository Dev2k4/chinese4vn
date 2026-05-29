# Chinese4VN - Database Design v2.0

## Kiến trúc tổng thể

```
                    ┌──────────────────────────────────────────────────────┐
                    │                  API Gateway                        │
                    └──┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┘
                       │    │    │    │    │    │    │    │    │    │
              ┌────────┴┐ ┌┴┐ ┌┴┐ ┌┴┐ ┌┴──┴┐ ┌┴┐ ┌┴┐ ┌┴┐ ┌┴┐ ┌┴┐
              │  Auth   │ │C│ │P│ │S│ │Sub- │ │S│ │G│ │M│ │U│ │I│
              │ Service │ │o│ │r│ │R│ │scrip│ │o│ │a│ │e│ │s│ │1│
              │         │ │n│ │o│ │S│ │tion │ │c│ │m│ │d│ │e│ │8│
              │(JWT,OAuth│ │t│ │g│ │ │ │     │ │i│ │i│ │i│ │r│ │n│
              │refresh,...│ │e│ │r│ │ │ │     │ │a│ │f│ │a│ │ │ │ │
              │         │ │n│ │e│ │ │ │     │ │l│ │i│ │ │ │C│ │ │
              │         │ │t│ │s│ │ │ │     │ │ │ │c│ │ │ │o│ │ │
              └────┬────┘ │ │s│ │ │ │     │ │ │ │a│ │ │ │n│ │ │
                   │      │ │ │ │ │ │     │ │ │ │t│ │ │ │t│ │ │
              ┌────┴────┐ │ │ │ │ │ │     │ │ │ │i│ │ │ │e│ │ │
              │Postgres │ │ │ │ │ │ │     │ │ │ │o│ │ │ │n│ │ │
              │(Auth DB)│ │ │ │ │ │ │     │ │ │ │n│ │ │ │t│ │ │
              └─────────┘ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
                          │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              ┌─────────┐ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              │Postgres │ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              │(Content)│ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              └─────────┘ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
                          │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              ┌─────────┐ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              │Postgres │ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              │(Progress│ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              │ + SRS)  │ │ │ │ │ │ │     │ │ │ │ │ │ │ │ │ │ │
              └─────────┘ └─┘─┘ └─┘─┘     └─┘ └─┘ └─┘ └─┘─┘ └─┘
```

> **Chiến lược**: Thiết kế theo hướng **modular monolith** — 1 DB nhưng phân chia rõ ràng theo domain. Sau này dễ tách thành microservices.

---

## Domain 1: Auth & User

### user — Thông tin người dùng cốt lõi
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| email | String? | unique, nullable (OAuth users may not have email) |
| username | String | unique |
| displayName | String | |
| password | String? | nullable — null nếu chỉ OAuth |
| avatar | String? | URL |
| nativeLanguage | String | default: "vi" |
| targetLanguage | String | default: "zh" |
| timezone | String | default: "Asia/Ho_Chi_Minh" |
| role | Enum: user, admin, moderator | |
| isActive | Boolean | soft delete |
| isEmailVerified | Boolean | |
| onboardingCompleted | Boolean | |
| lastLoginAt | DateTime | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### social_account — Liên kết OAuth
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| provider | Enum: google, facebook, apple | |
| providerId | String | ID từ provider |
| providerEmail | String? | |
| createdAt | DateTime | |

Unique: (provider, providerId)

### refresh_token — JWT Refresh tokens
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| token | String | unique |
| expiresAt | DateTime | |
| revokedAt | DateTime? | |
| createdAt | DateTime | |

### email_verification_token — Xác thực email
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| token | String | unique |
| expiresAt | DateTime | |
| verifiedAt | DateTime? | |
| createdAt | DateTime | |

### password_reset_token — Reset mật khẩu
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| token | String | unique |
| expiresAt | DateTime | |
| usedAt | DateTime? | |
| createdAt | DateTime | |

---

## Domain 2: Subscription

### subscription_plan — Gói cước
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| code | String | unique: "free", "basic", "premium", "yearly" |
| name | String | |
| description | String? | |
| price | Decimal | |
| currency | String | "VND", "USD" |
| durationDays | Int | 0 = unlimited |
| features | Json | VD: {"max_decks": 5, "speech_enabled": true, "offline_mode": true} |
| isActive | Boolean | |
| sortOrder | Int | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### user_subscription — Subscription của user
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| planId | cuid | FK → subscription_plan |
| startDate | DateTime | |
| endDate | DateTime | |
| isAutoRenew | Boolean | |
| status | Enum: active, expired, cancelled, paused | |
| paymentProvider | String? | "stripe", "google_play", "app_store" |
| paymentProviderId | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### payment_history — Lịch sử thanh toán
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| subscriptionId | cuid? | FK → user_subscription |
| amount | Decimal | |
| currency | String | |
| provider | String | |
| providerTransactionId | String? | |
| status | Enum: pending, completed, failed, refunded | |
| metadata | Json? | |
| createdAt | DateTime | |

---

## Domain 3: Content (Curriculum)

Đây là phần quan trọng nhất. Thiết kế theo cấu trúc phân cấp:

```
CourseFramework (HSK 3.0)
  └── CourseLevel (1-9)
       └── Unit (Unit 1: 你好)
            └── Lesson (Bài 1: 你好吗)
                 └── LessonStep (15-20 bước nhỏ, mỗi bước là 1 màn hình)
```

### course_framework — Khung chương trình (HSK 3.0 mới, TOCFL, ...)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| code | String | unique: "hsk30", "hsk_old", "tocfl" |
| name | String | "HSK 3.0", "HSK (Cũ)" |
| description | String? | |
| language | String | "zh" |
| isActive | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### course_level — Cấp độ (HSK 1-9)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| frameworkId | cuid | FK → course_framework |
| level | Int | 1-9 |
| name | String | "HSK 1", "HSK 2"... |
| description | String? | |
| order | Int | |
| totalWords | Int | mục tiêu |
| totalCharacters | Int | mục tiêu chữ Hán |
| totalGrammar | Int | |
| totalLessons | Int | |
| unlockRequirement | Json? | VD: {"required_level_id": "xxx", "min_xp": 500} |
| isActive | Boolean | |
| sortOrder | Int | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique: (frameworkId, level)

### unit — Bài/Unit lớn (VD: Unit 1: 你好)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| levelId | cuid | FK → course_level |
| title | String | "Unit 1: 你好" |
| titleEn | String? | English translation |
| description | String? | |
| order | Int | |
| isActive | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### lesson — Bài học
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| unitId | cuid | FK → unit |
| title | String | "Lesson 1: 你好吗" |
| titleEn | String? | |
| description | String? | |
| order | Int | |
| type | Enum: normal, boss, review, mock_test | boss = bài kiểm tra cuối unit |
| estimatedMinutes | Int | |
| xpReward | Int | XP khi hoàn thành |
| isActive | Boolean | |
| sortOrder | Int | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### lesson_prerequisite — Bài học tiên quyết (skill tree)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| lessonId | cuid | FK → lesson |
| requiredLessonId | cuid | FK → lesson |

Unique: (lessonId, requiredLessonId)

### lesson_step — Bước nhỏ trong bài (mỗi step = 1 màn hình, giống SuperChinese)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| lessonId | cuid | FK → lesson |
| order | Int | thứ tự trong bài |
| type | Enum: dialogue, explanation, new_words, grammar_intro, listening_choice, listening_fill, reading, meaning_select, hanzi_select, arrange_sentence, pinyin_input, flashcard, speaking, writing, review, vocab_match | |
| content | Json | nội dung cụ thể của step (xem bảng dưới) |
| xpReward | Int | |
| isOptional | Boolean | có thể bỏ qua? |
| createdAt | DateTime | |

content mẫu theo type:
```json
// dialogue
{
  "dialogueId": "xxx",
  "showPinyin": true,
  "showTranslation": true
}

// explanation
{
  "title": "Cách dùng 你好",
  "body": "你好 là cách chào hỏi thông thường...",
  "imageUrl": null
}

// new_words
{
  "vocabIds": ["v1", "v2", "v3"]
}

// listening_choice
{
  "audioUrl": "...",
  "prompt": "Nghe và chọn đáp án đúng",
  "questionId": "q1"
}

// speaking
{
  "vocabId": "v1",
  "prompt": "Hãy đọc to từ sau"
}
```

### dialogue — Hội thoại mẫu
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| lessonId | cuid | FK → lesson |
| title | String? | |
| audioUrl | String? | Full dialogue audio |
| createdAt | DateTime | |

### dialogue_line — Từng câu trong hội thoại
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| dialogueId | cuid | FK → dialogue |
| speaker | String | "A", "B" |
| hanzi | String | |
| pinyin | String | |
| meaning | String | |
| audioUrl | String? | |
| order | Int | |
| createdAt | DateTime | |

---

## Domain 4: Vocabulary & Characters

### vocabulary — Từ vựng (bảng chính)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| hanzi | String | chữ Hán |
| pinyin | String | |
| pinyinTone | String? | "nǐ hǎo" |
| meaning | String | nghĩa tiếng Việt |
| meaningEn | String? | nghĩa tiếng Anh |
| wordClass | String? | "动词", "名词", "形容词"... |
| difficulty | Int | 1-5 |
| frequencyRank | Int? | Thứ tự thông dụng |
| audioUrl | String? | |
| imageUrl | String? | |
| strokeSvg | String? | |
| strokeData | Json? | Mảng stroke data |
| radical | String? | Bộ thủ |
| radicalMeaning | String? | |
| decomposition | String? | Cấu tạo chữ |
| notes | String? | |
| isActive | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique: (hanzi, pinyin) — tránh trùng

### vocabulary_example — Câu ví dụ của từ
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| vocabularyId | cuid | FK → vocabulary |
| hanzi | String | |
| pinyin | String | |
| meaning | String | |
| audioUrl | String? | |
| order | Int | |
| createdAt | DateTime | |

### vocab_framework_mapping — Ánh xạ từ vựng vào khung/chương trình
1 từ có thể thuộc nhiều khung (VD: "人" có trong HSK 1 và TOCFL 1)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| vocabularyId | cuid | FK → vocabulary |
| levelId | cuid | FK → course_level |
| order | Int | Optional order within level |

Unique: (vocabularyId, levelId)

### lesson_vocab — Junction: bài học ↔ từ vựng
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| lessonId | cuid | FK → lesson |
| vocabId | cuid | FK → vocabulary |
| order | Int | |
| isNew | Boolean | từ mới trong bài này? |

### character — Chữ Hán (riêng biệt, độc lập với từ)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| hanzi | String | unique |
| pinyin | String | |
| meaning | String | |
| radical | String? | |
| strokeCount | Int? | |
| strokeOrder | String? | Mô tả thứ tự nét |
| strokeSvg | String? | |
| decomposition | String? | |
| frequencyRank | Int? | |
| notes | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### word_character — Junction: từ ↔ chữ Hán (phân tích cấu tạo từ)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| vocabularyId | cuid | FK → vocabulary |
| characterId | cuid | FK → character |
| position | Int | vị trí trong từ |
| pinyin | String? | |



---

## Domain 5: Grammar

### grammar_point — Điểm ngữ pháp
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| title | String | "Cách dùng 是" |
| titleEn | String? | |
| explanation | String | Giải thích dài |
| explanationEn | String? | |
| structure | String | Cấu trúc: "Subject + 是 + Noun" |
| structureEn | String? | |
| difficulty | Int | |
| isActive | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### grammar_example — Ví dụ ngữ pháp
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| grammarPointId | cuid | FK → grammar_point |
| hanzi | String | |
| pinyin | String | |
| meaning | String | |
| audioUrl | String? | |
| order | Int | |

### grammar_framework_mapping — Ánh xạ grammar vào khung/chương trình
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| grammarPointId | cuid | FK → grammar_point |
| levelId | cuid | FK → course_level |

### lesson_grammar — Junction: bài học ↔ ngữ pháp
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| lessonId | cuid | FK → lesson |
| grammarId | cuid | FK → grammar_point |
| order | Int | |

---

## Domain 6: Questions & Exercises

### question — Câu hỏi (dùng cho cả lesson step, ôn tập, mock test)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| type | Enum: flashcard, multiple_choice, listening_choice, listening_fill, reading, arrange_sentence, pinyin_input, meaning_select, hanzi_select, speaking, writing, matching, true_false, fill_blank | |
| prompt | String | Nội dung câu hỏi |
| promptEn | String? | |
| subPrompt | String? | Hướng dẫn thêm |
| pinyin | String? | |
| audioUrl | String? | |
| imageUrl | String? | |
| options | Json | Mảng lựa chọn (tùy type) |
| correctAnswer | Json | Đáp án đúng (có thể nhiều) |
| explanation | String? | Giải thích sau khi trả lời |
| difficulty | Int | |
| timeLimit | Int? | Giới hạn giây |
| vocabularyId | String? | FK → vocabulary |
| grammarPointId | String? | FK → grammar_point |
| isActive | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### step_question — Junction: step ↔ question (nếu step thuộc dạng exercise)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| stepId | cuid | FK → lesson_step |
| questionId | cuid | FK → question |
| order | Int | |

### mock_test — Bài thi thử HSK
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| levelId | cuid | FK → course_level |
| title | String | |
| description | String? | |
| timeLimit | Int | phút |
| totalQuestions | Int | |
| passingScore | Int | |
| isActive | Boolean | |
| order | Int | |
| createdAt | DateTime | |

### mock_test_section — Phần trong đề thi (Nghe, Đọc, Viết)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| mockTestId | cuid | FK → mock_test |
| title | String | "听力", "阅读" |
| type | Enum: listening, reading, writing | |
| order | Int | |
| totalQuestions | Int | |

### mock_test_question — Junction: mock_test ↔ question
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| mockTestId | cuid | FK → mock_test |
| sectionId | cuid? | FK → mock_test_section |
| questionId | cuid | FK → question |
| order | Int | |

---

## Domain 7: Progress & Analytics

### user_enrollment — Người dùng đang học level nào
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| levelId | cuid | FK → course_level |
| status | Enum: active, completed, paused | |
| startedAt | DateTime | |
| completedAt | DateTime? | |
| xpEarned | Int | Tổng XP ở level này |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique: (userId, levelId)

### lesson_attempt — Kết quả làm bài học
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| lessonId | cuid | FK → lesson |
| score | Int | 0-100 |
| totalSteps | Int | |
| completedSteps | Int | |
| xpEarned | Int | |
| timeSpentSeconds | Int | |
| isPassed | Boolean | Đỗ/trượt |
| isCompleted | Boolean | |
| attemptNumber | Int | Lần thứ mấy |
| mistakes | Json? | [{stepId, questionId, userAnswer, correctAnswer}] |
| completedAt | DateTime? | |
| createdAt | DateTime | |

Unique: (userId, lessonId, attemptNumber)

### step_attempt — Kết quả từng bước nhỏ
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| lessonId | cuid | FK → lesson |
| stepId | cuid | FK → lesson_step |
| isCorrect | Boolean? | null nếu không phải exercise |
| timeSpentSeconds | Int | |
| attemptsCount | Int | Số lần thử |
| createdAt | DateTime | |

### question_attempt — Lịch sử trả lời câu hỏi (chi tiết)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| questionId | cuid | FK → question |
| lessonId | cuid? | FK → lesson |
| mockTestId | cuid? | FK → mock_test |
| userAnswer | Json | |
| isCorrect | Boolean | |
| timeSpentSeconds | Int | |
| attemptNumber | Int | |
| createdAt | DateTime | |

### mock_test_attempt — Làm bài thi thử
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| mockTestId | cuid | FK → mock_test |
| score | Int | |
| totalQuestions | Int | |
| correctAnswers | Int | |
| timeSpentSeconds | Int | |
| sections | Json | [{sectionId, score, correct, total}] |
| isPassed | Boolean | |
| completedAt | DateTime | |
| createdAt | DateTime | |

### user_xp_log — Lịch sử XP
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| amount | Int | |
| source | Enum: lesson_complete, step_complete, review, achievement, streak_bonus, challenge, daily_bonus, mock_test | |
| referenceId | String? | lessonId / achievementId /... |
| createdAt | DateTime | |

### daily_activity — Thống kê hàng ngày
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| date | Date | |
| totalXp | Int | |
| totalLessonsCompleted | Int | |
| totalStepsCompleted | Int | |
| totalReviewsDone | Int | |
| totalTimeSpentSeconds | Int | |
| wordsLearned | Int | |
| streakCount | Int | Chuỗi ngày liên tiếp |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique: (userId, date)

### user_streak — Lưu streak history
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| currentStreak | Int | |
| longestStreak | Int | |
| lastActiveDate | Date | |
| freezeCount | Int | Số ngày đóng băng |
| maxFreeze | Int | |
| updatedAt | DateTime | |

---

## Domain 8: SRS (Spaced Repetition)

Hệ thống SRS áp dụng SM-2 algorithm, hỗ trợ 3 loại đối tượng:
- Vocabulary (từ vựng)
- Grammar Point (ngữ pháp)
- Example Sentence (câu ví dụ)

### srs_item — Trạng thái SRS của từng item
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| vocabularyId | cuid? | FK → vocabulary (nullable) |
| grammarPointId | cuid? | FK → grammar_point (nullable) |
| exampleId | cuid? | FK → vocabulary_example (nullable) |
| srsType | Enum: vocab, grammar, sentence | |
| stage | Enum: new, learning, review, relearning, mastered | |
| interval | Int | Khoảng cách ngày |
| easeFactor | Float | SM-2 ease factor |
| repetitions | Int | Số lần review đúng liên tiếp |
| lastQuality | Int | 0-5 |
| nextReviewAt | DateTime | |
| totalReviews | Int | |
| correctReviews | Int | |
| lapsedCount | Int | Số lần quên |
| avgResponseTime | Float? | Thời gian TB trả lời (giây) |
| lastReviewedAt | DateTime? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Check constraint: phải có ít nhất 1 trong (vocabularyId, grammarPointId, exampleId)

### srs_review_log — Lịch sử review
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| srsItemId | cuid | FK → srs_item |
| quality | Int | 0-5 |
| timeSpentSeconds | Int | |
| previousInterval | Int | |
| previousEaseFactor | Float | |
| previousRepetitions | Int | |
| isCorrect | Boolean | |
| source | Enum: review_session, lesson, quick_review | |
| createdAt | DateTime | |

### srs_session — Phiên ôn tập
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| startedAt | DateTime | |
| endedAt | DateTime? | |
| totalReviewed | Int | |
| correctCount | Int | |
| xpEarned | Int | |
| createdAt | DateTime | |

---

## Domain 9: Custom Decks

### user_deck — Bộ từ tự tạo
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| title | String | |
| description | String? | |
| isPublic | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### user_deck_item — Thành phần trong deck
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| deckId | cuid | FK → user_deck |
| vocabularyId | cuid? | FK → vocabulary |
| grammarPointId | cuid? | FK → grammar_point |
| customHanzi | String? | Tự nhập |
| customPinyin | String? | |
| customMeaning | String? | |
| notes | String? | |
| order | Int | |
| createdAt | DateTime | |

### user_deck_srs — SRS cho custom deck items (SMS-2 riêng)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| deckItemId | cuid | FK → user_deck_item |
| ... | (giống srs_item) | |

---

## Domain 10: Social

### friendship — Kết bạn
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| requesterId | cuid | FK → user |
| addresseeId | cuid | FK → user |
| status | Enum: pending, accepted, blocked | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### leaderboard_entry — Bảng xếp hạng
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| timeframe | Enum: daily, weekly, monthly, all_time | |
| xpTotal | Int | |
| rank | Int | |
| weekStart | Date? | |
| monthStart | Date? | |
| updatedAt | DateTime | |

Unique: (userId, timeframe, weekStart) / (userId, timeframe, monthStart)

### challenge — Thách đấu
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| challengerId | cuid | FK → user |
| opponentId | cuid | FK → user |
| lessonId | cuid | FK → lesson |
| scoreChallenger | Int? | |
| scoreOpponent | Int? | |
| status | Enum: pending, accepted, completed, expired, declined | |
| startedAt | DateTime? | |
| completedAt | DateTime? | |
| expiresAt | DateTime | |
| createdAt | DateTime | |

### friend_activity — Hoạt động gần đây của bạn bè (feed)
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| type | Enum: lesson_complete, achievement, level_up, streak | |
| data | Json | VD: {lessonId, lessonTitle, xp} |
| createdAt | DateTime | |

---

## Domain 11: Gamification

### achievement — Thành tích
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| code | String | unique: "first_lesson", "streak_7", "vocab_100", "hsk1_master" |
| name | String | |
| nameEn | String? | |
| description | String | |
| descriptionEn | String? | |
| iconUrl | String? | |
| xpReward | Int | |
| category | Enum: learning, streak, social, special | |
| criteria | Json | VD: {"type": "lesson_count", "count": 1} |
| isHidden | Boolean | Hidden until unlocked |
| createdAt | DateTime | |

### user_achievement — Thành tích người dùng
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| achievementId | cuid | FK → achievement |
| progress | Json? | progress toward achievement |
| isCompleted | Boolean | |
| completedAt | DateTime? | |
| createdAt | DateTime | |

---

## Domain 12: Handwriting & Speech

### handwriting_practice — Luyện viết chữ
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| characterId | cuid | FK → character |
| strokesData | Json | Mảng tọa độ nét vẽ |
| accuracy | Float | Điểm chính xác 0-100 |
| timeSpentSeconds | Int | |
| score | Int? | |
| createdAt | DateTime | |

### speech_attempt — Luyện nói
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| vocabularyId | cuid? | FK → vocabulary |
| questionId | cuid? | FK → question |
| audioUrl | String | URL bản ghi |
| score | Float? | 0-100 |
| phonemeScores | Json? | Chi tiết từng âm |
| duration | Float | |
| createdAt | DateTime | |

---

## Domain 13: User Notes & Bookmarks

### user_bookmark — Đánh dấu
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| vocabularyId | cuid? | FK → vocabulary |
| grammarPointId | cuid? | FK → grammar_point |
| lessonId | cuid? | FK → lesson |
| characterId | cuid? | FK → character |
| createdAt | DateTime | |

### user_note — Ghi chú cá nhân
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | cuid | FK → user |
| vocabularyId | cuid? | FK → vocabulary |
| grammarPointId | cuid? | FK → grammar_point |
| content | String | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

## Domain 14: Media & i18n

### media — Quản lý media assets
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| url | String | |
| type | Enum: audio, image, video | |
| format | String | "mp3", "wav", "png" |
| duration | Float? | cho audio |
| size | Int | bytes |
| language | String? | |
| createdAt | DateTime | |

### translation — Bản dịch i18n cho UI
| Field | Type | Notes |
|---|---|---|
| id | cuid | PK |
| locale | String | "vi", "en", "zh", "ja" |
| key | String | "home.title", "lesson.start" |
| value | String | |
| updatedAt | DateTime | |

Unique: (locale, key)

---

## ER Diagram (Text)

```
USER ───< SOCIAL_ACCOUNT
USER ───< REFRESH_TOKEN
USER ───< EMAIL_VERIFICATION_TOKEN
USER ───< PASSWORD_RESET_TOKEN
USER ───< USER_SUBSCRIPTION ───> SUBSCRIPTION_PLAN
USER_SUBSCRIPTION ───< PAYMENT_HISTORY

COURSE_FRAMEWORK ───< COURSE_LEVEL ───< UNIT ───< LESSON
LESSON ───< LESSON_PREREQUISITE
LESSON ───< LESSON_STEP
LESSON ───< DIALOGUE ───< DIALOGUE_LINE
LESSON ───< LESSON_VOCAB ───> VOCABULARY
LESSON ───< LESSON_GRAMMAR ───> GRAMMAR_POINT
VOCABULARY ───< VOCAB_EXAMPLE
VOCABULARY ───< VOCAB_FRAMEWORK_MAPPING ───> COURSE_LEVEL
GRAMMAR_POINT ───< GRAMMAR_EXAMPLE
GRAMMAR_POINT ───< GRAMMAR_FRAMEWORK_MAPPING ───> COURSE_LEVEL
CHARACTER ───< WORD_CHARACTER ───> VOCABULARY

LESSON_STEP ───< STEP_QUESTION ───> QUESTION

MOCK_TEST ───< MOCK_TEST_SECTION
MOCK_TEST ───< MOCK_TEST_QUESTION ───> QUESTION

USER ───< USER_ENROLLMENT ───> COURSE_LEVEL
USER ───< LESSON_ATTEMPT ───> LESSON
USER ───< STEP_ATTEMPT ───> LESSON_STEP
USER ───< QUESTION_ATTEMPT ───> QUESTION
USER ───< MOCK_TEST_ATTEMPT ───> MOCK_TEST
USER ───< USER_XP_LOG
USER ───< DAILY_ACTIVITY
USER ───< USER_STREAK

USER ───< SRS_ITEM ───> VOCABULARY/GRAMMAR_POINT/VOCAB_EXAMPLE
SRS_ITEM ───< SRS_REVIEW_LOG
USER ───< SRS_SESSION

USER ───< USER_DECK ───< USER_DECK_ITEM ───> VOCABULARY/GRAMMAR_POINT
USER_DECK_ITEM ───< USER_DECK_SRS

USER ───< FRIENDSHIP (requesterId)
USER ───< FRIENDSHIP (addresseeId)
USER ───< LEADERBOARD_ENTRY
USER ───< CHALLENGE (challengerId)
USER ───< CHALLENGE (opponentId)
USER ───< FRIEND_ACTIVITY

USER ───< USER_ACHIEVEMENT ───> ACHIEVEMENT

USER ───< HANDWRITING_PRACTICE ───> CHARACTER
USER ───< SPEECH_ATTEMPT ───> VOCABULARY

USER ───< USER_BOOKMARK
USER ───< USER_NOTE
```

---

## Tổng số bảng: ~50 bảng

## Chiến lược triển khai theo phase

| Phase | Bảng | Ghi chú |
|---|---|---|
| **Phase 1** | User, SocialAccount, RefreshToken, CourseFramework, CourseLevel, Unit, Lesson, LessonStep, Vocabulary, VocabExample, VocabFrameworkMapping, LessonVocab, Character, WordCharacter, GrammarPoint, GrammarExample, GrammarFrameworkMapping, LessonGrammar, Question, StepQuestion, LessonAttempt, StepAttempt, QuestionAttempt, UserXpLog, DailyActivity, UserStreak, UserEnrollment, SrsItem, SrsReviewLog, SrsSession | Core app — triển ngay |
| **Phase 2** | SubscriptionPlan, UserSubscription, PaymentHistory | Monetization |
| **Phase 3** | Friendship, LeaderboardEntry, Challenge, FriendActivity | Social |
| **Phase 4** | Achievement, UserAchievement | Gamification |
| **Phase 5** | HandwritingPractice, SpeechAttempt | Speech & Writing |
| **Phase 6** | UserDeck, UserDeckItem, UserDeckSrs | Custom decks |
| **Phase 7** | UserBookmark, UserNote, Translation, Media | Utility |
| **Phase 8** | MockTest, MockTestSection, MockTestQuestion | Mock tests |

---

## Kế hoạch seed data

| Dữ liệu | Số lượng | Ghi chú |
|---|---|---|
| HSK 1 từ vựng | ~500 từ | |
| HSK 2 từ vựng | ~772 từ | |
| HSK 3 từ vựng | ~973 từ | |
| HSK 4 từ vựng | ~1000 từ | |
| HSK 5 từ vựng | ~1071 từ | |
| HSK 6 từ vựng | ~1140 từ | |
| HSK 7-9 từ vựng | ~5636 từ | Có thể làm sau |
| Lesson steps | ~500-1000 steps | Cần thiết kế nội dung |
| Questions | ~2000-3000 câu | Cần biên soạn |
| Placement test | 50 câu | Che đủ HSK 1-4 |

> Nguồn dữ liệu: Có thể crawl từ các từ điển mở (CC-CEDICT, HanViet) hoặc nhập từ các bộ từ vựng HSK công khai.
