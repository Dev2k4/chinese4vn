import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Assign Questions to Mock Tests ===\n');

  const mockTests = await prisma.mockTest.findMany({
    include: { level: true },
  });

  if (mockTests.length === 0) {
    console.log('No mock tests found. Run seed.ts first.');
    return;
  }

  for (const mt of mockTests) {
    // Get all questions for this level
    const questions = await prisma.question.findMany({
      where: {
        vocabulary: { levelId: mt.levelId },
        type: { in: ['multiple_choice', 'meaning_select', 'hanzi_select', 'pinyin_input', 'listening_choice'] },
      },
      take: 40,
      orderBy: { difficulty: 'asc' },
    });

    if (questions.length === 0) {
      console.log(`  ${mt.title || 'Mock test'}: no questions, skip`);
      continue;
    }

    // Split into listening/reading sections
    const half = Math.floor(questions.length / 2);
    const listeningQ = questions.slice(0, half).map((q) => q.id);
    const readingQ = questions.slice(half).map((q) => q.id);

    const sections = [
      {
        id: 'listening',
        title: { vi: 'Nghe hiểu', en: 'Listening Comprehension' },
        type: 'listening',
        questionIds: listeningQ,
      },
      {
        id: 'reading',
        title: { vi: 'Đọc hiểu', en: 'Reading Comprehension' },
        type: 'reading',
        questionIds: readingQ,
      },
    ];

    await prisma.mockTest.update({
      where: { id: mt.id },
      data: { sections: sections as any },
    });

    console.log(`  ${mt.title || 'Mock test'}: ${questions.length} questions assigned`);
  }

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
