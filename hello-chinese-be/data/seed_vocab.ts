import { PrismaClient, Track } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function viEn(vi: string, en: string) {
  return { vi, en } as any;
}

interface VocabEntry {
  hanzi: string;
  pinyin: string;
  level: number;
  pos: string;
  wordClass: { vi: string; en: string } | null;
  translations: { vi?: string; en?: string } | null;
}

async function ensureLevel(levelNum: number) {
  const framework = await prisma.courseFramework.findFirst({ where: { code: 'HSK' } });
  if (!framework) throw new Error('No HSK framework found');

  let level = await prisma.courseLevel.findFirst({
    where: { frameworkId: framework.id, level: levelNum },
  });
  if (!level) {
    const levelNames: Record<number, { name: string; nameEn: string; desc: string; words: number }> = {
      1: { name: 'HSK 1', nameEn: 'HSK 1', desc: 'Cơ bản - 500 từ vựng', words: 500 },
      2: { name: 'HSK 2', nameEn: 'HSK 2', desc: 'Cơ bản - 772 từ vựng', words: 772 },
      3: { name: 'HSK 3', nameEn: 'HSK 3', desc: 'Trung cấp - 973 từ vựng', words: 973 },
      4: { name: 'HSK 4', nameEn: 'HSK 4', desc: 'Trung cấp cao - 1000 từ vựng', words: 1000 },
      5: { name: 'HSK 5', nameEn: 'HSK 5', desc: 'Cao cấp - 1071 từ vựng', words: 1071 },
      6: { name: 'HSK 6', nameEn: 'HSK 6', desc: 'Cao cấp - 1140 từ vựng', words: 1140 },
      7: { name: 'HSK 7-9', nameEn: 'HSK 7-9', desc: 'Thông thạo - 5631 từ vựng', words: 5631 },
    };
    const info = levelNames[levelNum] || { name: `HSK ${levelNum}`, nameEn: `HSK ${levelNum}`, desc: '', words: 0 };
    level = await prisma.courseLevel.create({
      data: {
        frameworkId: framework.id,
        level: levelNum,
        name: info.name,
        nameEn: info.nameEn,
        description: info.desc,
        order: levelNum,
        totalWords: info.words,
      },
    });
    console.log(`  Created CourseLevel HSK ${levelNum}`);

    // Create learning paths
    const tracks: { code: string; track: Track; name: Record<string,string>; desc: Record<string,string> }[] = [
      { code: `new-${levelNum}`, track: 'new' as Track, name: viEn(`Mới HSK ${levelNum}`, `New HSK ${levelNum}`), desc: viEn(`Lộ trình chi tiết cho người mới HSK ${levelNum}`, `Scaffolded path for HSK ${levelNum} beginners`) },
      { code: `exp-${levelNum}`, track: 'exp' as Track, name: viEn(`Tăng tốc HSK ${levelNum}`, `Express HSK ${levelNum}`), desc: viEn(`Lộ trình cấp tốc HSK ${levelNum}`, `Accelerated HSK ${levelNum} path`) },
      { code: `review-${levelNum}`, track: 'review' as Track, name: viEn(`Ôn tập HSK ${levelNum}`, `Review HSK ${levelNum}`), desc: viEn(`Lộ trình ôn tập HSK ${levelNum}`, `Review path for HSK ${levelNum}`) },
    ];
    for (const t of tracks) {
      const existing = await prisma.learningPath.findUnique({ where: { code: t.code } });
      if (!existing) {
        await prisma.learningPath.create({ data: { code: t.code, track: t.track, levelId: level.id, name: t.name, description: t.desc, order: levelNum } });
      }
    }
    console.log(`  Created learning paths for HSK ${levelNum}`);
  }
  return level;
}

async function main() {
  console.log('=== HSK Vocabulary Seeder ===\n');

  // 1. Create levels 5-7 if missing
  console.log('Ensuring levels 5, 6, 7 exist...');
  for (const level of [5, 6, 7]) {
    await ensureLevel(level);
  }

  // 2. Load vocabulary JSON
  const dataDir = path.join(__dirname, '..', 'data');
  const jsonPath = path.join(dataDir, 'hsk30-vocab-translated.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }
  const vocabList: VocabEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`\nLoaded ${vocabList.length} vocabulary entries`);

  // 3. Get level mapping
  const framework = await prisma.courseFramework.findFirst({ where: { code: 'HSK' } });
  if (!framework) { console.error('No framework'); process.exit(1); }
  const allLevels = await prisma.courseLevel.findMany({ where: { frameworkId: framework.id } });
  const levelMap = new Map<number, string>();
  for (const l of allLevels) levelMap.set(l.level, l.id);
  console.log(`Available levels: ${[...levelMap.keys()].sort((a,b)=>a-b).join(', ')}`);

  // 4. Upsert vocabulary
  console.log('\nUpserting vocabulary...');
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < vocabList.length; i++) {
    const v = vocabList[i];
    const levelId = levelMap.get(v.level);
    if (!levelId) {
      console.warn(`  Skip ${v.hanzi}: no level for HSK ${v.level}`);
      skipped++;
      continue;
    }

    try {
      await prisma.vocabulary.upsert({
        where: { hanzi_pinyin: { hanzi: v.hanzi, pinyin: v.pinyin } },
        create: {
          hanzi: v.hanzi,
          pinyin: v.pinyin,
          levelId,
          translations: v.translations as any,
          wordClass: v.wordClass as any,
          difficulty: Math.ceil(v.level / 3),
          order: i,
        },
        update: {
          translations: v.translations as any,
          wordClass: v.wordClass as any,
        },
      });
      created++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Duplicate on upsert - try updateMany
        try {
          await prisma.vocabulary.updateMany({
            where: { hanzi: v.hanzi, pinyin: v.pinyin },
            data: {
              translations: v.translations as any,
              wordClass: v.wordClass as any,
              levelId,
            },
          });
          updated++;
        } catch (e2: any) {
          console.error(`  Error updating ${v.hanzi}: ${e2?.message}`);
          skipped++;
        }
      } else {
        console.error(`  Error upserting ${v.hanzi}: ${e?.message}`);
        skipped++;
      }
    }

    if ((i + 1) % 1000 === 0) {
      console.log(`  Progress: ${i + 1}/${vocabList.length}`);
    }
  }

  // 5. Update level word counts
  console.log('\nUpdating level word counts...');
  for (const [levelNum, levelId] of levelMap) {
    const count = await prisma.vocabulary.count({ where: { levelId } });
    await prisma.courseLevel.update({
      where: { id: levelId },
      data: { totalWords: count },
    });
    console.log(`  HSK ${levelNum}: ${count} words`);
  }

  console.log(`\n✅ Done! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
