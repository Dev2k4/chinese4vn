import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface GrammarEntry {
  level: number;
  title: { vi: string; en: string };
  explanation: { vi: string; en: string };
  structure: { vi: string; en: string };
  examples: { hanzi: string; pinyin: string; translations: Record<string,string> }[];
  grammarType: string;
  order: number;
}

async function main() {
  console.log('=== HSK Grammar Seeder ===\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const jsonPath = path.join(dataDir, 'hsk30-grammar-seed-ready.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }
  const entries: GrammarEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${entries.length} grammar entries`);

  const framework = await prisma.courseFramework.findFirst({ where: { code: 'HSK' } });
  if (!framework) { console.error('No framework'); process.exit(1); }

  const allLevels = await prisma.courseLevel.findMany({ where: { frameworkId: framework.id } });
  const levelMap = new Map<number, string>();
  for (const l of allLevels) levelMap.set(l.level, l.id);

  console.log('\nUpserting grammar points...');
  let created = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const levelId = levelMap.get(e.level);
    if (!levelId) {
      console.warn(`  Skip: no level for HSK ${e.level}`);
      continue;
    }

    try {
      await prisma.grammarPoint.create({
        data: {
          levelId,
          title: e.title as any,
          explanation: e.explanation as any,
          structure: e.structure as any,
          examples: e.examples.length > 0 ? e.examples : undefined,
          difficulty: Math.ceil(e.level / 3),
          order: e.order,
        },
      });
      created++;
    } catch (e2: any) {
      console.error(`  Error creating grammar #${i}: ${e2?.message}`);
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${entries.length}`);
    }
  }

  // Update grammar counts per level
  console.log('\nUpdating grammar counts...');
  for (const [level, levelId] of levelMap) {
    const count = await prisma.grammarPoint.count({ where: { levelId } });
    await prisma.courseLevel.update({
      where: { id: levelId },
      data: { totalGrammar: count },
    });
    console.log(`  HSK ${level}: ${count} grammar points`);
  }

  console.log(`\n✅ Done! Created ${created} grammar points`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
