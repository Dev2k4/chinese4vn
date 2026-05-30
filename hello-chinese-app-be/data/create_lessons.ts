import { PrismaClient, LessonType, StepType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const vi = (val: string) => ({ vi: val });
const viEn = (viStr: string, enStr: string) => ({ vi: viStr, en: enStr });

// Theme names per level
const THEMES: Record<number, { vi: string; en: string }[]> = {
  1: [
    { vi: 'Chào hỏi & Giới thiệu', en: 'Greetings & Introductions' },
    { vi: 'Số đếm & Thời gian', en: 'Numbers & Time' },
    { vi: 'Gia đình & Bạn bè', en: 'Family & Friends' },
    { vi: 'Đồ ăn & Mua sắm', en: 'Food & Shopping' },
    { vi: 'Sinh hoạt hàng ngày', en: 'Daily Life' },
    { vi: 'Màu sắc & Tính từ', en: 'Colors & Adjectives' },
  ],
  2: [
    { vi: 'Cuộc sống hàng ngày', en: 'Daily Routine' },
    { vi: 'Trường học & Lớp học', en: 'School & Classroom' },
    { vi: 'Du lịch & Phương tiện', en: 'Travel & Transportation' },
    { vi: 'Thời tiết & Mùa', en: 'Weather & Seasons' },
    { vi: 'Sở thích & Giải trí', en: 'Hobbies & Entertainment' },
    { vi: 'Sức khỏe & Cơ thể', en: 'Health & Body' },
  ],
  3: [
    { vi: 'Công việc & Nghề nghiệp', en: 'Work & Careers' },
    { vi: 'Giao thông & Du lịch', en: 'Transportation & Travel' },
    { vi: 'Mua sắm & Dịch vụ', en: 'Shopping & Services' },
    { vi: 'Quan hệ xã hội', en: 'Social Relationships' },
    { vi: 'Giáo dục & Học tập', en: 'Education & Learning' },
    { vi: 'Văn hóa & Phong tục', en: 'Culture & Customs' },
  ],
  4: [
    { vi: 'Kinh doanh & Tài chính', en: 'Business & Finance' },
    { vi: 'Môi trường & Xã hội', en: 'Environment & Society' },
    { vi: 'Khoa học & Công nghệ', en: 'Science & Technology' },
    { vi: 'Nghệ thuật & Văn học', en: 'Arts & Literature' },
    { vi: 'Sức khỏe & Y tế', en: 'Health & Medicine' },
    { vi: 'Luật pháp & Chính trị', en: 'Law & Politics' },
  ],
  5: [
    { vi: 'Công việc văn phòng', en: 'Office Work' },
    { vi: 'Giáo dục & Học tập', en: 'Education & Study' },
    { vi: 'Xã hội & Quan hệ', en: 'Society & Relationships' },
    { vi: 'Sức khỏe & Y tế', en: 'Health & Medicine' },
    { vi: 'Khoa học & Công nghệ', en: 'Science & Technology' },
    { vi: 'Kinh tế & Tài chính', en: 'Economy & Finance' },
    { vi: 'Văn hóa & Giải trí', en: 'Culture & Entertainment' },
  ],
  6: [
    { vi: 'Chính trị & Pháp luật', en: 'Politics & Law' },
    { vi: 'Môi trường & Tự nhiên', en: 'Environment & Nature' },
    { vi: 'Tâm lý & Cảm xúc', en: 'Psychology & Emotions' },
    { vi: 'Kinh doanh & Thương mại', en: 'Business & Commerce' },
    { vi: 'Nghệ thuật & Văn học', en: 'Arts & Literature' },
    { vi: 'Lịch sử & Triết học', en: 'History & Philosophy' },
    { vi: 'Truyền thông & Báo chí', en: 'Media & Journalism' },
  ],
  7: [
    { vi: 'Chuyên ngành học thuật', en: 'Academic Disciplines' },
    { vi: 'Nghiên cứu khoa học', en: 'Scientific Research' },
    { vi: 'Y học chuyên sâu', en: 'Advanced Medicine' },
    { vi: 'Luật pháp & Hành chính', en: 'Law & Administration' },
    { vi: 'Kinh tế vĩ mô', en: 'Macroeconomics' },
    { vi: 'Ngoại giao & Quốc tế', en: 'Diplomacy & International' },
    { vi: 'Triết học & Tư tưởng', en: 'Philosophy & Thought' },
    { vi: 'Kỹ thuật & Công nghệ cao', en: 'Engineering & High Tech' },
    { vi: 'Văn hóa cổ điển', en: 'Classical Culture' },
    { vi: 'Phân tích xã hội', en: 'Social Analysis' },
    { vi: 'Môi trường & Phát triển', en: 'Environment & Development' },
    { vi: 'Nghệ thuật đương đại', en: 'Contemporary Arts' },
  ],
};

const WORDS_PER_LESSON = 50;
const LESSONS_PER_UNIT = 3;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function createLevelLessons(levelNum: number) {
  console.log(`\n=== HSK ${levelNum} ===`);

  const level = await prisma.courseLevel.findFirst({
    where: { level: levelNum },
    include: { framework: true },
  });
  if (!level) {
    console.log(`  Level ${levelNum} not found`);
    return;
  }

  // Get vocabulary
  const vocab = await prisma.vocabulary.findMany({
    where: { levelId: level.id, isActive: true },
    orderBy: { order: 'asc' },
  });
  // Get grammar
  const grammar = await prisma.grammarPoint.findMany({
    where: { levelId: level.id, isActive: true },
    orderBy: { order: 'asc' },
  });

  if (vocab.length === 0 && grammar.length === 0) {
    console.log(`  No data for HSK ${levelNum}`);
    return;
  }

  const themes = THEMES[levelNum] || [];
  const wordChunks = chunkArray(vocab, WORDS_PER_LESSON);
  const grammarChunks = chunkArray(grammar, Math.min(WORDS_PER_LESSON / 2, grammar.length || 1));
  const totalLessons = wordChunks.length;
  const totalUnits = Math.ceil(totalLessons / LESSONS_PER_UNIT);

  console.log(`  ${vocab.length} words → ${totalLessons} lessons in ${totalUnits} units`);
  console.log(`  ${grammar.length} grammar points`);

  // Delete existing units & lessons for this level
  const existingUnits = await prisma.unit.findMany({
    where: { levelId: level.id },
    select: { id: true },
  });
  const existingUnitIds = existingUnits.map((u) => u.id);
  await prisma.lessonVocab.deleteMany({ where: { lesson: { unitId: { in: existingUnitIds } } } });
  await prisma.lessonGrammar.deleteMany({ where: { lesson: { unitId: { in: existingUnitIds } } } });
  await prisma.lessonStep.deleteMany({ where: { lesson: { unitId: { in: existingUnitIds } } } });
  await prisma.learningPathLesson.deleteMany({ where: { unit: { path: { levelId: level.id } } } });
  await prisma.learningPathUnit.deleteMany({ where: { path: { levelId: level.id } } });
  await prisma.lesson.deleteMany({ where: { unitId: { in: existingUnitIds } } });
  await prisma.unit.deleteMany({ where: { levelId: level.id } });

  // Find matching questions
  const allVocabHanzi = vocab.map((v) => v.hanzi);
  const questions = await prisma.question.findMany({
    where: { vocabularyId: { in: vocab.map((v) => v.id) } },
  });
  const questionsByVocab = new Map<string, string[]>();
  for (const q of questions) {
    if (q.vocabularyId) {
      const list = questionsByVocab.get(q.vocabularyId) || [];
      list.push(q.id);
      questionsByVocab.set(q.vocabularyId, list);
    }
  }
  console.log(`  ${questions.length} linked questions`);

  // Get learning paths for this level
  const paths = await prisma.learningPath.findMany({ where: { levelId: level.id } });

  let unitIndex = 0;
  let lessonGlobalOrder = 0;

  for (let ui = 0; ui < totalUnits; ui++) {
    const theme = themes[ui % themes.length] || { vi: `Chủ đề ${ui + 1}`, en: `Theme ${ui + 1}` };
    unitIndex++;

    const unit = await prisma.unit.create({
      data: {
        levelId: level.id,
        title: viEn(theme.vi, theme.en),
        order: unitIndex,
      },
    });

    const startLesson = ui * LESSONS_PER_UNIT;
    const endLesson = Math.min(startLesson + LESSONS_PER_UNIT, totalLessons);

    for (let li = startLesson; li < endLesson; li++) {
      lessonGlobalOrder++;
      const wordChunk = wordChunks[li] || [];
      const gramChunk = grammarChunks[li] || [];
      const lessonWords = wordChunk.map((w) => w.hanzi).join(', ');
      const lessonTitleVi = `Bài ${lessonGlobalOrder}: ${lessonWords.slice(0, 40)}...`;
      const lessonTitleEn = `Lesson ${lessonGlobalOrder}`;

      const lesson = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          title: viEn(lessonTitleVi, lessonTitleEn),
          order: li - startLesson + 1,
          type: 'normal' as LessonType,
          estimatedMinutes: Math.ceil(wordChunk.length * 2),
          xpReward: wordChunk.length * 2,
        },
      });

      // Link vocabulary
      if (wordChunk.length > 0) {
        await prisma.lessonVocab.createMany({
          data: wordChunk.map((w, i) => ({
            lessonId: lesson.id,
            vocabId: w.id,
            order: i + 1,
            isNew: true,
          })),
        });
      }

      // Link grammar
      if (gramChunk.length > 0) {
        await prisma.lessonGrammar.createMany({
          data: gramChunk.map((g, i) => ({
            lessonId: lesson.id,
            grammarId: g.id,
            order: i + 1,
          })),
        });
      }

      // Create lesson steps from questions
      const lessonQIds: string[] = [];
      for (const w of wordChunk) {
        const qids = questionsByVocab.get(w.id) || [];
        lessonQIds.push(...qids);
      }

      // Create flashcard step for each vocab item
      let stepOrder = 0;
      for (const w of wordChunk) {
        stepOrder++;
        const qids = questionsByVocab.get(w.id) || [];
        await prisma.lessonStep.create({
          data: {
            lessonId: lesson.id,
            order: stepOrder,
            type: 'flashcard' as StepType,
            content: {
              type: 'flashcard',
              vocabId: w.id,
              hanzi: w.hanzi,
              pinyin: w.pinyin,
              translations: w.translations,
              questionIds: qids.slice(0, 3),
            },
            xpReward: 5,
          },
        });
      }

      // Add a review step at end
      stepOrder++;
      await prisma.lessonStep.create({
        data: {
          lessonId: lesson.id,
          order: stepOrder,
          type: 'review' as StepType,
          content: { type: 'review', lessonIndex: li },
          xpReward: 10,
        },
      });
    }

    // Link unit to all learning paths
    for (const path of paths) {
      let pathUnit = await prisma.learningPathUnit.findFirst({
        where: { pathId: path.id, name: { path: ['name'], equals: unit.title } as any },
      });
      if (!pathUnit) {
        pathUnit = await prisma.learningPathUnit.create({
          data: {
            pathId: path.id,
            name: unit.title as any,
            order: unitIndex,
          },
        });
      }

      const unitLessons = await prisma.lesson.findMany({
        where: { unitId: unit.id },
        orderBy: { order: 'asc' },
      });
      for (const lesson of unitLessons) {
        await prisma.learningPathLesson.upsert({
          where: { unitId_lessonId: { unitId: pathUnit.id, lessonId: lesson.id } },
          create: { unitId: pathUnit.id, lessonId: lesson.id, order: lesson.order },
          update: {},
        });
      }
    }
  }

  // Update level counts
  const unitCount = await prisma.unit.count({ where: { levelId: level.id } });
  const lessonCount = await prisma.lesson.count({ where: { unit: { levelId: level.id } } });
  await prisma.courseLevel.update({
    where: { id: level.id },
    data: { totalLessons: lessonCount },
  });
  console.log(`  Created ${unitCount} units, ${lessonCount} lessons`);
}

async function main() {
  console.log('=== Create Lessons for HSK 1-7 ===\n');

  for (const level of [1, 2, 3, 4, 5, 6, 7]) {
    await createLevelLessons(level);
  }

  // Verify
  console.log('\n=== Final Summary ===');
  const levels = await prisma.courseLevel.findMany({ orderBy: { level: 'asc' } });
  for (const l of levels) {
    const units = await prisma.unit.count({ where: { levelId: l.id } });
    const lessons = await prisma.lesson.count({ where: { unit: { levelId: l.id } } });
    const paths = await prisma.learningPath.count({ where: { levelId: l.id } });
    console.log(`HSK ${l.level}: ${units} units, ${lessons} lessons, ${paths} paths, ${l.totalWords} words, ${l.totalGrammar} grammar`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
