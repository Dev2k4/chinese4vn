import { PrismaClient, QuestionType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface GenQuestion {
  id: string;
  type: string;
  prompt: { vi: string; en: string };
  pinyin?: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  vocabularyHanzi: string;
}

async function main() {
  console.log('=== Question Seeder ===\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const jsonPath = path.join(dataDir, 'hsk30-questions-generated.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }
  const questions: GenQuestion[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${questions.length} questions`);

  // Find vocabulary by hanzi to link question → vocabularyId
  console.log('\nBuilding vocabulary lookup...');
  const allVocab = await prisma.vocabulary.findMany({ select: { id: true, hanzi: true } });
  const vocabByHanzi = new Map<string, string>();
  for (const v of allVocab) {
    // Prefer shorter hanzi (usually the main word, not variant)
    const existing = vocabByHanzi.get(v.hanzi);
    if (!existing || v.hanzi.length <= (existing.length || 99)) {
      vocabByHanzi.set(v.hanzi, v.id);
    }
  }
  console.log(`Found ${vocabByHanzi.size} vocabulary entries by hanzi`);

  let created = 0;
  let skipped = 0;

  // Batch upsert - delete old generated questions first
  console.log('\nClearing old generated questions...');
  await prisma.question.deleteMany({
    where: { id: { startsWith: 'q-vocab-' } },
  });

  console.log('Creating questions...');
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const vocabId = vocabByHanzi.get(q.vocabularyHanzi);

    try {
      await prisma.question.create({
        data: {
          id: q.id,
          type: q.type as QuestionType,
          prompt: q.prompt as any,
          pinyin: q.pinyin || null,
          options: q.options,
          correctAnswer: q.correctAnswer as any,
          difficulty: q.difficulty,
          vocabularyId: vocabId || null,
        },
      });
      created++;
    } catch (e: any) {
      console.error(`  Error creating ${q.id}: ${e?.message}`);
      skipped++;
    }

    if ((i + 1) % 5000 === 0) {
      console.log(`  Progress: ${i + 1}/${questions.length} (${created} created)`);
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
