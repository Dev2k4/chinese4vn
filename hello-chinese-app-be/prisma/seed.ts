import { PrismaClient, LessonType, StepType, QuestionType, SrsType, Track } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const vi = (val: string) => ({ vi: val });
const viEn = (viStr: string, enStr: string) => ({ vi: viStr, en: enStr });
const wc = (viStr: string, enStr: string) => ({ vi: viStr, en: enStr });

async function main() {
  console.log("Seeding database...");

  // Clean existing data in reverse dependency order
  await prisma.learningPathLesson.deleteMany();
  await prisma.learningPathUnit.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.questionAttempt.deleteMany();
  await prisma.stepAttempt.deleteMany();
  await prisma.lessonAttempt.deleteMany();
  await prisma.mockTestAttempt.deleteMany();
  await prisma.srsReviewLog.deleteMany();
  await prisma.srsItem.deleteMany();
  await prisma.userXpLog.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.userStreak.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userEnrollment.deleteMany();
  await prisma.userBookmark.deleteMany();
  await prisma.userNote.deleteMany();
  await prisma.userDeckItem.deleteMany();
  await prisma.userDeck.deleteMany();
  await prisma.speechAttempt.deleteMany();
  await prisma.handwritingPractice.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.user.deleteMany();

  await prisma.question.deleteMany();
  await prisma.lessonVocab.deleteMany();
  await prisma.lessonGrammar.deleteMany();
  await prisma.lessonStep.deleteMany();
  await prisma.vocabularyExample.deleteMany();
  await prisma.grammarPoint.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.mockTest.deleteMany();
  await prisma.courseLevel.deleteMany();
  await prisma.courseFramework.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.character.deleteMany();

  // ── Framework ──
  const framework = await prisma.courseFramework.create({
    data: { code: "HSK", name: "Hanyu Shuiping Kaoshi", nameEn: "Chinese Proficiency Test", description: "Chinese Proficiency Test", language: "zh" },
  });

  // ── Helper to create learning paths for a level ──
  async function createLearningPaths(levelId: string, levelNum: number) {
    const tracks: { code: string; track: Track; name: Record<string,string>; desc: Record<string,string> }[] = [
      { code: `new-${levelNum}`, track: "new", name: viEn(`Mới HSK ${levelNum}`, `New HSK ${levelNum}`), desc: viEn(`Lộ trình chi tiết cho người mới HSK ${levelNum}`, `Scaffolded path for HSK ${levelNum} beginners`) },
      { code: `exp-${levelNum}`, track: "exp", name: viEn(`Tăng tốc HSK ${levelNum}`, `Express HSK ${levelNum}`), desc: viEn(`Lộ trình cấp tốc HSK ${levelNum}`, `Accelerated HSK ${levelNum} path`) },
      { code: `review-${levelNum}`, track: "review", name: viEn(`Ôn tập HSK ${levelNum}`, `Review HSK ${levelNum}`), desc: viEn(`Lộ trình ôn tập HSK ${levelNum}`, `Review path for HSK ${levelNum}`) },
    ];
    for (const t of tracks) {
      await prisma.learningPath.create({
        data: { code: t.code, track: t.track, levelId, name: t.name, description: t.desc, order: levelNum },
      });
    }
  }

  function pathCode(levelNum: number, track: string) {
    return `${track}-${levelNum}`;
  }

  // ════════════════════════════════════════
  // HSK 1 DATA
  // ════════════════════════════════════════

  const level1 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 1, name: "HSK 1", nameEn: "HSK 1", description: "Cơ bản - 150 từ vựng", order: 1, totalWords: 150, totalGrammar: 15 },
  });

  await createLearningPaths(level1.id, 1);

  // ── Unit 1: Chào hỏi cơ bản ──
  const u1 = await prisma.unit.create({
    data: { levelId: level1.id, title: viEn("Chào hỏi cơ bản", "Basic Greetings"), order: 1 },
  });

  // Lesson 1.1: Chào hỏi
  const l1 = await prisma.lesson.create({
    data: { unitId: u1.id, title: viEn("Chào hỏi", "Greetings"), order: 1, type: "normal", estimatedMinutes: 5 },
  });
  const v1 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "你好", pinyin: "nǐ hǎo", translations: viEn("Xin chào", "Hello"), wordClass: wc("câu", "phrase"), order: 1 } });
  const v2 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "你们", pinyin: "nǐ men", translations: viEn("Các bạn", "You (plural)"), wordClass: wc("đại từ", "pronoun"), order: 2 } });
  const v3 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "我", pinyin: "wǒ", translations: viEn("Tôi, tớ", "I, me"), wordClass: wc("đại từ", "pronoun"), order: 3 } });
  const v4 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "是", pinyin: "shì", translations: viEn("Là", "To be"), wordClass: wc("động từ", "verb"), order: 4 } });
  const v5 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "好", pinyin: "hǎo", translations: viEn("Tốt, khỏe", "Good, well"), wordClass: wc("tính từ", "adjective"), order: 5 } });
  await prisma.lessonVocab.createMany({ data: [
    { lessonId: l1.id, vocabId: v1.id, order: 1 }, { lessonId: l1.id, vocabId: v2.id, order: 2 },
    { lessonId: l1.id, vocabId: v3.id, order: 3 }, { lessonId: l1.id, vocabId: v4.id, order: 4 },
    { lessonId: l1.id, vocabId: v5.id, order: 5 },
  ]});
  const g1 = await prisma.grammarPoint.create({
    data: { levelId: level1.id, title: viEn("Câu chào 你好", "Greeting 你好"), explanation: viEn("Cách chào phổ biến nhất. 你 = bạn, 好 = tốt.", "The most common greeting. 你 = you, 好 = good."), structure: viEn("Chủ ngữ + 好", "Subject + 好"), examples: [{ hanzi: "你好！", pinyin: "Nǐ hǎo!", translations: { vi: "Xin chào!", en: "Hello!" } }, { hanzi: "大家好！", pinyin: "Dàjiā hǎo!", translations: { vi: "Chào mọi người!", en: "Hello everyone!" } }], order: 1 },
  });
  const g2 = await prisma.grammarPoint.create({
    data: { levelId: level1.id, title: viEn("Câu khẳng định với 是", "Affirmative with 是"), explanation: viEn("是 là động từ 'là', nối chủ ngữ và danh từ.", "是 is the verb 'to be', connecting subject and noun."), structure: viEn("A + 是 + B", "A + 是 + B"), examples: [{ hanzi: "我是学生。", pinyin: "Wǒ shì xuéshēng.", translations: { vi: "Tôi là học sinh.", en: "I am a student." } }, { hanzi: "这是书。", pinyin: "Zhè shì shū.", translations: { vi: "Đây là sách.", en: "This is a book." } }], order: 2 },
  });
  await prisma.lessonGrammar.createMany({ data: [{ lessonId: l1.id, grammarId: g1.id, order: 1 }, { lessonId: l1.id, grammarId: g2.id, order: 2 }] });

  const questions = [
    { prompt: vi("你好"), pinyin: "nǐ hǎo", options: ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"], correctAnswer: JSON.stringify("Xin chào"), type: "flashcard" as const },
    { prompt: vi("Chọn nghĩa đúng của từ: 我"), options: ["Bạn", "Tôi", "Anh ấy", "Cô ấy"], correctAnswer: JSON.stringify("Tôi"), type: "multiple_choice" as const },
    { prompt: vi('"你好" có nghĩa là gì?'), options: ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"], correctAnswer: JSON.stringify("Xin chào"), type: "meaning_select" as const },
    { prompt: vi("Chọn hanzi đúng cho 'nǐ hǎo'"), options: ["你好", "你们", "我好", "你是"], correctAnswer: JSON.stringify("你好"), type: "hanzi_select" as const },
    { prompt: vi("Điền pinyin cho từ 是"), options: ["shì", "sì", "shí", "sī"], correctAnswer: JSON.stringify("shì"), type: "pinyin_input" as const },
    { prompt: vi("Sắp xếp: 我 + 是 + 学生"), options: ["我是学生", "学生是我", "是我学生", "学生我是"], correctAnswer: JSON.stringify("我是学生"), type: "arrange_sentence" as const },
  ];
  for (let i = 0; i < questions.length; i++) {
    const q = await prisma.question.create({
      data: { type: questions[i].type as QuestionType, prompt: questions[i].prompt, pinyin: questions[i].pinyin, options: questions[i].options, correctAnswer: questions[i].correctAnswer },
    });
    await prisma.lessonStep.create({ data: { lessonId: l1.id, order: i + 1, type: "flashcard" as StepType, content: { questionId: q.id, type: q.type, prompt: q.prompt } } });
  }

  // Lesson 1.2: Hỏi thăm sức khỏe
  const l2 = await prisma.lesson.create({
    data: { unitId: u1.id, title: viEn("Hỏi thăm sức khỏe", "Asking about health"), order: 2, type: "normal", estimatedMinutes: 5 },
  });
  const v6 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "很", pinyin: "hěn", translations: viEn("Rất", "Very"), wordClass: wc("phó từ", "adverb"), order: 6 } });
  const v7 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "吗", pinyin: "ma", translations: viEn("Câu hỏi (trợ từ)", "Question particle"), wordClass: wc("trợ từ", "particle"), order: 7 } });
  const v8 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "呢", pinyin: "ne", translations: viEn("Thì sao? (trợ từ)", "And? (particle)"), wordClass: wc("trợ từ", "particle"), order: 8 } });
  const v9 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "也", pinyin: "yě", translations: viEn("Cũng", "Also"), wordClass: wc("phó từ", "adverb"), order: 9 } });
  const v10 = await prisma.vocabulary.create({ data: { levelId: level1.id, hanzi: "不", pinyin: "bù", translations: viEn("Không", "Not, no"), wordClass: wc("phó từ", "adverb"), order: 10 } });
  await prisma.lessonVocab.createMany({ data: [
    { lessonId: l2.id, vocabId: v6.id, order: 1 }, { lessonId: l2.id, vocabId: v7.id, order: 2 },
    { lessonId: l2.id, vocabId: v8.id, order: 3 }, { lessonId: l2.id, vocabId: v9.id, order: 4 },
    { lessonId: l2.id, vocabId: v10.id, order: 5 },
  ]});
  const g3 = await prisma.grammarPoint.create({
    data: { levelId: level1.id, title: viEn("Câu hỏi với 吗", "Questions with 吗"), explanation: viEn("Thêm 吗 cuối câu trần thuật để tạo câu hỏi Yes/No.", "Add 吗 at the end of a statement to form yes/no questions."), structure: viEn("Câu trần thuật + 吗？", "Statement + 吗？"), examples: [{ hanzi: "你好吗？", pinyin: "Nǐ hǎo ma?", translations: { vi: "Bạn có khỏe không?", en: "How are you?" } }, { hanzi: "你是学生吗？", pinyin: "Nǐ shì xuéshēng ma?", translations: { vi: "Bạn có phải học sinh không?", en: "Are you a student?" } }], order: 3 },
  });
  const g4 = await prisma.grammarPoint.create({
    data: { levelId: level1.id, title: viEn("Phó từ 很 và 也", "Adverbs 很 and 也"), explanation: viEn("很 = rất, đứng trước tính từ. 也 = cũng, đứng trước động từ/tính từ.", "很 = very, before adjectives. 也 = also/too, before verbs/adjectives."), structure: viEn("Chủ ngữ + 很/也 + Tính từ", "Subject + 很/也 + Adjective"), examples: [{ hanzi: "我很好。", pinyin: "Wǒ hěn hǎo.", translations: { vi: "Tôi rất khỏe.", en: "I am very well." } }, { hanzi: "我也很好。", pinyin: "Wǒ yě hěn hǎo.", translations: { vi: "Tôi cũng rất khỏe.", en: "I am also very well." } }], order: 4 },
  });
  await prisma.lessonGrammar.createMany({ data: [{ lessonId: l2.id, grammarId: g3.id, order: 1 }, { lessonId: l2.id, grammarId: g4.id, order: 2 }] });

  // ── Unit 2: Số đếm và tuổi tác ──
  const u2 = await prisma.unit.create({ data: { levelId: level1.id, title: viEn("Số đếm và tuổi tác", "Numbers & Age"), order: 2 } });

  const l3 = await prisma.lesson.create({ data: { unitId: u2.id, title: viEn("Số đếm 1-10", "Numbers 1-10"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const nums = [
    { hanzi: "一", pinyin: "yī", translations: viEn("Một", "One") }, { hanzi: "二", pinyin: "èr", translations: viEn("Hai", "Two") },
    { hanzi: "三", pinyin: "sān", translations: viEn("Ba", "Three") }, { hanzi: "四", pinyin: "sì", translations: viEn("Bốn", "Four") },
    { hanzi: "五", pinyin: "wǔ", translations: viEn("Năm", "Five") }, { hanzi: "六", pinyin: "liù", translations: viEn("Sáu", "Six") },
    { hanzi: "七", pinyin: "qī", translations: viEn("Bảy", "Seven") }, { hanzi: "八", pinyin: "bā", translations: viEn("Tám", "Eight") },
    { hanzi: "九", pinyin: "jiǔ", translations: viEn("Chín", "Nine") }, { hanzi: "十", pinyin: "shí", translations: viEn("Mười", "Ten") },
  ];
  const vocabNums: any[] = [];
  for (let i = 0; i < nums.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level1.id, ...nums[i], wordClass: wc("số từ", "numeral"), order: 11 + i } });
    vocabNums.push(v);
    await prisma.lessonVocab.create({ data: { lessonId: l3.id, vocabId: v.id, order: i + 1 } });
  }

  // ── Unit 3: Gia đình và nghề nghiệp ──
  const u3 = await prisma.unit.create({ data: { levelId: level1.id, title: viEn("Gia đình và nghề nghiệp", "Family & Jobs"), order: 3 } });
  const l4 = await prisma.lesson.create({ data: { unitId: u3.id, title: viEn("Thành viên gia đình", "Family Members"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const family = [
    { hanzi: "爸爸", pinyin: "bàba", translations: viEn("Bố, ba", "Dad") }, { hanzi: "妈妈", pinyin: "māma", translations: viEn("Mẹ, má", "Mom") },
    { hanzi: "哥哥", pinyin: "gēge", translations: viEn("Anh trai", "Elder brother") }, { hanzi: "姐姐", pinyin: "jiějie", translations: viEn("Chị gái", "Elder sister") },
    { hanzi: "弟弟", pinyin: "dìdi", translations: viEn("Em trai", "Younger brother") }, { hanzi: "妹妹", pinyin: "mèimei", translations: viEn("Em gái", "Younger sister") },
    { hanzi: "家", pinyin: "jiā", translations: viEn("Nhà, gia đình", "Home, family") }, { hanzi: "人", pinyin: "rén", translations: viEn("Người", "Person") },
  ];
  for (let i = 0; i < family.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level1.id, ...family[i], wordClass: wc("danh từ", "noun"), order: 21 + i } });
    await prisma.lessonVocab.create({ data: { lessonId: l4.id, vocabId: v.id, order: i + 1 } });
  }

  // ── Unit 4: Ngày tháng và thời gian ──
  const u4 = await prisma.unit.create({ data: { levelId: level1.id, title: viEn("Ngày tháng và thời gian", "Date & Time"), order: 4 } });
  const l5 = await prisma.lesson.create({ data: { unitId: u4.id, title: viEn("Thứ trong tuần", "Days of Week"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const time = [
    { hanzi: "今天", pinyin: "jīntiān", translations: viEn("Hôm nay", "Today") }, { hanzi: "明天", pinyin: "míngtiān", translations: viEn("Ngày mai", "Tomorrow") },
    { hanzi: "昨天", pinyin: "zuótiān", translations: viEn("Hôm qua", "Yesterday") }, { hanzi: "年", pinyin: "nián", translations: viEn("Năm", "Year") },
    { hanzi: "月", pinyin: "yuè", translations: viEn("Tháng", "Month") }, { hanzi: "日", pinyin: "rì", translations: viEn("Ngày", "Day") },
    { hanzi: "星期", pinyin: "xīngqī", translations: viEn("Tuần", "Week") },
  ];
  for (let i = 0; i < time.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level1.id, ...time[i], wordClass: wc("danh từ", "noun"), order: 29 + i } });
    await prisma.lessonVocab.create({ data: { lessonId: l5.id, vocabId: v.id, order: i + 1 } });
  }

  // ── Unit 5: Ăn uống và mua sắm ──
  const u5 = await prisma.unit.create({ data: { levelId: level1.id, title: viEn("Ăn uống và mua sắm", "Food & Shopping"), order: 5 } });
  const l6 = await prisma.lesson.create({ data: { unitId: u5.id, title: viEn("Đồ ăn thức uống", "Food & Drinks"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const food = [
    { hanzi: "水", pinyin: "shuǐ", translations: viEn("Nước", "Water") }, { hanzi: "茶", pinyin: "chá", translations: viEn("Trà", "Tea") },
    { hanzi: "米饭", pinyin: "mǐfàn", translations: viEn("Cơm", "Rice") }, { hanzi: "苹果", pinyin: "píngguǒ", translations: viEn("Táo", "Apple") },
    { hanzi: "钱", pinyin: "qián", translations: viEn("Tiền", "Money") },
  ];
  for (let i = 0; i < food.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level1.id, ...food[i], wordClass: wc("danh từ", "noun"), order: 36 + i } });
    await prisma.lessonVocab.create({ data: { lessonId: l6.id, vocabId: v.id, order: i + 1 } });
  }

  // ── Unit 6: Màu sắc và tính từ ──
  const u6 = await prisma.unit.create({ data: { levelId: level1.id, title: viEn("Màu sắc và tính từ", "Colors & Adjectives"), order: 6 } });
  const l7 = await prisma.lesson.create({ data: { unitId: u6.id, title: viEn("Màu sắc", "Colors"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const colors = [
    { hanzi: "红", pinyin: "hóng", translations: viEn("Đỏ", "Red") }, { hanzi: "白", pinyin: "bái", translations: viEn("Trắng", "White") },
    { hanzi: "黑", pinyin: "hēi", translations: viEn("Đen", "Black") }, { hanzi: "漂亮", pinyin: "piàoliang", translations: viEn("Đẹp", "Beautiful") },
    { hanzi: "高", pinyin: "gāo", translations: viEn("Cao", "Tall") },
  ];
  for (let i = 0; i < colors.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level1.id, ...colors[i], wordClass: wc("tính từ", "adjective"), order: 41 + i } });
    await prisma.lessonVocab.create({ data: { lessonId: l7.id, vocabId: v.id, order: i + 1 } });
  }

  // ════════════════════════════════════════
  // HSK 2 (partial - 1 unit)
  // ════════════════════════════════════════
  const level2 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 2, name: "HSK 2", nameEn: "HSK 2", description: "Cơ bản - 300 từ vựng", order: 2, totalWords: 300, totalGrammar: 30 },
  });

  await createLearningPaths(level2.id, 2);

  const u2_1 = await prisma.unit.create({ data: { levelId: level2.id, title: viEn("Cuộc sống hàng ngày", "Daily Life"), order: 1 } });
  const l2_1 = await prisma.lesson.create({ data: { unitId: u2_1.id, title: viEn("Thức dậy và vệ sinh cá nhân", "Wake up & Hygiene"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const daily = [
    { hanzi: "起床", pinyin: "qǐchuáng", translations: viEn("Thức dậy", "Get up"), wordClass: wc("động từ", "verb") },
    { hanzi: "洗", pinyin: "xǐ", translations: viEn("Rửa", "Wash"), wordClass: wc("động từ", "verb") },
    { hanzi: "脸", pinyin: "liǎn", translations: viEn("Mặt", "Face"), wordClass: wc("danh từ", "noun") },
    { hanzi: "刷牙", pinyin: "shuāyá", translations: viEn("Đánh răng", "Brush teeth"), wordClass: wc("động từ", "verb") },
    { hanzi: "早饭", pinyin: "zǎofàn", translations: viEn("Bữa sáng", "Breakfast"), wordClass: wc("danh từ", "noun") },
  ];
  for (let i = 0; i < daily.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level2.id, hanzi: daily[i].hanzi, pinyin: daily[i].pinyin, translations: daily[i].translations, wordClass: daily[i].wordClass, order: i + 1 } });
    await prisma.lessonVocab.create({ data: { lessonId: l2_1.id, vocabId: v.id, order: i + 1 } });
  }
  const g2_1 = await prisma.grammarPoint.create({
    data: { levelId: level2.id, title: viEn("Động-tân ngữ", "Verb-Object"), explanation: viEn("Nhiều động từ tiếng Trung kết hợp trực tiếp với tân ngữ. VD: 起床 (rời giường), 洗脸 (rửa mặt).", "Many Chinese verbs combine directly with an object. E.g., 起床 (get up), 洗脸 (wash face)."), structure: viEn("Động từ + Tân ngữ", "Verb + Object"), examples: [{ hanzi: "我六点起床。", pinyin: "Wǒ liù diǎn qǐchuáng.", translations: { vi: "Tôi thức dậy lúc 6 giờ.", en: "I get up at 6 o'clock." } }], order: 1 },
  });
  await prisma.lessonGrammar.create({ data: { lessonId: l2_1.id, grammarId: g2_1.id, order: 1 } });

  // ════════════════════════════════════════
  // HSK 3 (partial - 1 unit)
  // ════════════════════════════════════════
  const level3 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 3, name: "HSK 3", nameEn: "HSK 3", description: "Trung cấp - 600 từ vựng", order: 3, totalWords: 600, totalGrammar: 60 },
  });

  await createLearningPaths(level3.id, 3);

  const u3_1 = await prisma.unit.create({ data: { levelId: level3.id, title: viEn("Du lịch và phương hướng", "Travel & Directions"), order: 1 } });
  const l3_1 = await prisma.lesson.create({ data: { unitId: u3_1.id, title: viEn("Hỏi đường", "Asking for Directions"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const travel = [
    { hanzi: "机场", pinyin: "jīchǎng", translations: viEn("Sân bay", "Airport") }, { hanzi: "火车", pinyin: "huǒchē", translations: viEn("Tàu hỏa", "Train") },
    { hanzi: "地铁", pinyin: "dìtiě", translations: viEn("Tàu điện ngầm", "Subway") }, { hanzi: "左边", pinyin: "zuǒbiān", translations: viEn("Bên trái", "Left side") },
    { hanzi: "右边", pinyin: "yòubiān", translations: viEn("Bên phải", "Right side") },
  ];
  for (let i = 0; i < travel.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level3.id, hanzi: travel[i].hanzi, pinyin: travel[i].pinyin, translations: travel[i].translations, wordClass: wc("danh từ", "noun"), order: i + 1 } });
    await prisma.lessonVocab.create({ data: { lessonId: l3_1.id, vocabId: v.id, order: i + 1 } });
  }

  // ════════════════════════════════════════
  // HSK 4 (partial - 1 unit)
  // ════════════════════════════════════════
  const level4 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 4, name: "HSK 4", nameEn: "HSK 4", description: "Trung cấp cao - 1200 từ vựng", order: 4, totalWords: 1200, totalGrammar: 100 },
  });

  await createLearningPaths(level4.id, 4);

  // ════════════════════════════════════════
  // HSK 5
  // ════════════════════════════════════════
  const level5 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 5, name: "HSK 5", nameEn: "HSK 5", description: "Cao cấp - 1070 từ vựng", order: 5, totalWords: 1070, totalGrammar: 70 },
  });
  await createLearningPaths(level5.id, 5);

  // ════════════════════════════════════════
  // HSK 6
  // ════════════════════════════════════════
  const level6 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 6, name: "HSK 6", nameEn: "HSK 6", description: "Cao cấp - 1140 từ vựng", order: 6, totalWords: 1140, totalGrammar: 50 },
  });
  await createLearningPaths(level6.id, 6);

  // ════════════════════════════════════════
  // HSK 7-9
  // ════════════════════════════════════════
  const level7 = await prisma.courseLevel.create({
    data: { frameworkId: framework.id, level: 7, name: "HSK 7-9", nameEn: "HSK 7-9", description: "Thông thạo - 5630 từ vựng", order: 7, totalWords: 5630, totalGrammar: 134 },
  });
  await createLearningPaths(level7.id, 7);

  const u4_1 = await prisma.unit.create({ data: { levelId: level4.id, title: viEn("Công việc và kinh doanh", "Work & Business"), order: 1 } });
  const l4_1 = await prisma.lesson.create({ data: { unitId: u4_1.id, title: viEn("Phỏng vấn xin việc", "Job Interview"), order: 1, type: "normal", estimatedMinutes: 5 } });
  const work = [
    { hanzi: "公司", pinyin: "gōngsī", translations: viEn("Công ty", "Company") }, { hanzi: "工作", pinyin: "gōngzuò", translations: viEn("Công việc", "Work") },
    { hanzi: "面试", pinyin: "miànshì", translations: viEn("Phỏng vấn", "Interview") }, { hanzi: "经验", pinyin: "jīngyàn", translations: viEn("Kinh nghiệm", "Experience") },
    { hanzi: "机会", pinyin: "jīhuì", translations: viEn("Cơ hội", "Opportunity") },
  ];
  for (let i = 0; i < work.length; i++) {
    const v = await prisma.vocabulary.create({ data: { levelId: level4.id, hanzi: work[i].hanzi, pinyin: work[i].pinyin, translations: work[i].translations, wordClass: wc("danh từ", "noun"), order: i + 1 } });
    await prisma.lessonVocab.create({ data: { lessonId: l4_1.id, vocabId: v.id, order: i + 1 } });
  }

  // ════════════════════════════════════════
  // Learning Path → Unit → Lesson linking
  // ════════════════════════════════════════

  async function linkPathUnits(levelNum: number, track: Track, unitLessons: { unitId: string; unitOrder: number; lessons: { lessonId: string; order: number }[] }[]) {
    const path = await prisma.learningPath.findUnique({ where: { code: pathCode(levelNum, track) } });
    if (!path) return;
    for (const ul of unitLessons) {
      const unit = await prisma.unit.findUnique({ where: { id: ul.unitId } });
      const pu = await prisma.learningPathUnit.create({
        data: { pathId: path.id, name: (unit?.title || {}) as any, order: ul.unitOrder },
      });
      for (const l of ul.lessons) {
        await prisma.learningPathLesson.create({
          data: { unitId: pu.id, lessonId: l.lessonId, order: l.order },
        });
      }
    }
  }

  // HSK 1: new path gets all lessons in order, exp gets all, review gets all
  const hsk1AllLessons = [
    { unitId: u1.id, unitOrder: 1, lessons: [{ lessonId: l1.id, order: 1 }, { lessonId: l2.id, order: 2 }] },
    { unitId: u2.id, unitOrder: 2, lessons: [{ lessonId: l3.id, order: 1 }] },
    { unitId: u3.id, unitOrder: 3, lessons: [{ lessonId: l4.id, order: 1 }] },
    { unitId: u4.id, unitOrder: 4, lessons: [{ lessonId: l5.id, order: 1 }] },
    { unitId: u5.id, unitOrder: 5, lessons: [{ lessonId: l6.id, order: 1 }] },
    { unitId: u6.id, unitOrder: 6, lessons: [{ lessonId: l7.id, order: 1 }] },
  ];
  for (const track of ["new", "exp", "review"] as const) {
    await linkPathUnits(1, track, hsk1AllLessons);
  }

  // HSK 2-4: same, link existing lessons
  const hsk2AllLessons = [{ unitId: u2_1.id, unitOrder: 1, lessons: [{ lessonId: l2_1.id, order: 1 }] }];
  const hsk3AllLessons = [{ unitId: u3_1.id, unitOrder: 1, lessons: [{ lessonId: l3_1.id, order: 1 }] }];
  const hsk4AllLessons = [{ unitId: u4_1.id, unitOrder: 1, lessons: [{ lessonId: l4_1.id, order: 1 }] }];
  for (const track of ["new", "exp", "review"] as const) {
    await linkPathUnits(2, track, hsk2AllLessons);
    await linkPathUnits(3, track, hsk3AllLessons);
    await linkPathUnits(4, track, hsk4AllLessons);
  }

  // ════════════════════════════════════════
  // Mock Tests
  // ════════════════════════════════════════
  await prisma.mockTest.create({
    data: { levelId: level1.id, title: viEn("Thi thử HSK 1", "HSK 1 Mock Test"), description: viEn("Bài thi thử HSK 1", "HSK 1 Mock Test"), timeLimit: 30, passingScore: 60, sections: [{ title: { vi: "Nghe hiểu", en: "Listening" }, type: "listening", questionIds: [] }, { title: { vi: "Đọc hiểu", en: "Reading" }, type: "reading", questionIds: [] }] },
  });
  await prisma.mockTest.create({
    data: { levelId: level2.id, title: viEn("Thi thử HSK 2", "HSK 2 Mock Test"), description: viEn("Bài thi thử HSK 2", "HSK 2 Mock Test"), timeLimit: 40, passingScore: 60, sections: [{ title: { vi: "Nghe hiểu", en: "Listening" }, type: "listening", questionIds: [] }, { title: { vi: "Đọc hiểu", en: "Reading" }, type: "reading", questionIds: [] }] },
  });

  // ════════════════════════════════════════
  // Achievements
  // ════════════════════════════════════════
  await prisma.achievement.createMany({ data: [
    { code: "first_lesson", name: "Bài học đầu tiên", nameEn: "First Lesson", description: "Hoàn thành bài học đầu tiên", descriptionEn: "Complete your first lesson", xpReward: 50, category: "lesson", criteria: { type: "lesson_count", count: 1 } },
    { code: "streak_7", name: "7 ngày liên tiếp", nameEn: "7-Day Streak", description: "Học 7 ngày liên tiếp", descriptionEn: "Study for 7 consecutive days", xpReward: 100, category: "streak", criteria: { type: "streak", count: 7 } },
    { code: "vocab_50", name: "50 từ vựng", nameEn: "50 Words", description: "Học được 50 từ vựng", descriptionEn: "Learn 50 vocabulary words", xpReward: 100, category: "vocabulary", criteria: { type: "vocab_count", count: 50 } },
  ]});

  // ════════════════════════════════════════
  // Characters (partial - common ones)
  // ════════════════════════════════════════
  await prisma.character.createMany({ data: [
    { hanzi: "我", pinyin: "wǒ", meaning: "tôi", radical: "戈", strokeCount: 7 },
    { hanzi: "你", pinyin: "nǐ", meaning: "bạn", radical: "亻", strokeCount: 7 },
    { hanzi: "好", pinyin: "hǎo", meaning: "tốt", radical: "女", strokeCount: 6 },
    { hanzi: "是", pinyin: "shì", meaning: "là", radical: "日", strokeCount: 9 },
    { hanzi: "不", pinyin: "bù", meaning: "không", radical: "一", strokeCount: 4 },
    { hanzi: "人", pinyin: "rén", meaning: "người", radical: "人", strokeCount: 2 },
    { hanzi: "大", pinyin: "dà", meaning: "to", radical: "大", strokeCount: 3 },
    { hanzi: "小", pinyin: "xiǎo", meaning: "nhỏ", radical: "小", strokeCount: 3 },
    { hanzi: "水", pinyin: "shuǐ", meaning: "nước", radical: "水", strokeCount: 4 },
    { hanzi: "火", pinyin: "huǒ", meaning: "lửa", radical: "火", strokeCount: 4 },
  ]});

  // ════════════════════════════════════════
  // Vocabulary Examples for common words
  // ════════════════════════════════════════
  await prisma.vocabularyExample.createMany({ data: [
    { vocabularyId: v1.id, hanzi: "你好，我叫小明。", pinyin: "Nǐ hǎo, wǒ jiào Xiǎo Míng.", translations: viEn("Xin chào, tôi tên là Tiểu Minh.", "Hello, my name is Xiaoming."), order: 1 },
    { vocabularyId: v3.id, hanzi: "我是学生。", pinyin: "Wǒ shì xuéshēng.", translations: viEn("Tôi là học sinh.", "I am a student."), order: 1 },
    { vocabularyId: v4.id, hanzi: "这是书。", pinyin: "Zhè shì shū.", translations: viEn("Đây là sách.", "This is a book."), order: 1 },
    { vocabularyId: v5.id, hanzi: "我很好。", pinyin: "Wǒ hěn hǎo.", translations: viEn("Tôi rất khỏe.", "I am very well."), order: 1 },
    { vocabularyId: v6.id, hanzi: "我很好。", pinyin: "Wǒ hěn hǎo.", translations: viEn("Tôi rất tốt.", "I am very good."), order: 1 },
    { vocabularyId: v7.id, hanzi: "你好吗？", pinyin: "Nǐ hǎo ma?", translations: viEn("Bạn có khỏe không?", "How are you?"), order: 1 },
    { vocabularyId: v9.id, hanzi: "我也很好。", pinyin: "Wǒ yě hěn hǎo.", translations: viEn("Tôi cũng rất tốt.", "I am also very good."), order: 1 },
    { vocabularyId: v10.id, hanzi: "我不好。", pinyin: "Wǒ bù hǎo.", translations: viEn("Tôi không tốt.", "I am not well."), order: 1 },
  ]});

  // ════════════════════════════════════════
  // Update level counts
  // ════════════════════════════════════════
  const hsk1VocabCount = await prisma.vocabulary.count({ where: { levelId: level1.id } });
  const hsk1GrammarCount = await prisma.grammarPoint.count({ where: { levelId: level1.id } });
  await prisma.courseLevel.update({ where: { id: level1.id }, data: { totalWords: hsk1VocabCount, totalGrammar: hsk1GrammarCount } });

  // ── Test User ──
  const testPassword = await bcrypt.hash("test123456", 10);
  await prisma.user.upsert({
    where: { email: "test@chinese4vn.com" },
    update: {},
    create: {
      email: "test@chinese4vn.com",
      username: "testuser",
      displayName: "Test User",
      password: testPassword,
      nativeLanguage: "vi",
      targetLanguage: "zh",
      onboardingCompleted: true,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`  Test user: test@chinese4vn.com / test123456`);

  console.log("Seed completed!");
  console.log(`  HSK 1: ${hsk1VocabCount} words, ${hsk1GrammarCount} grammar points`);
  console.log(`  HSK 2: 5 words, 1 grammar point`);
  console.log(`  HSK 3: 5 words, 0 grammar points`);
  console.log(`  HSK 4: 5 words, 0 grammar points`);
  console.log(`  HSK 5: 0 words, 0 grammar points (created)`);
  console.log(`  HSK 6: 0 words, 0 grammar points (created)`);
  console.log(`  HSK 7: 0 words, 0 grammar points (created)`);
  console.log(`  HSK 5: 0 words, 0 grammar points`);
  console.log(`  HSK 6: 0 words, 0 grammar points`);
  console.log(`  HSK 7: 0 words, 0 grammar points`);
  console.log(`  Mock Tests: 2`);
  console.log(`  Achievements: 3`);
  console.log(`  Characters: 10`);
  console.log(`  Learning paths: 21 (3 tracks × 7 levels)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
