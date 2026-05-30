import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const HW_DIR = path.join(
  __dirname,
  "..",
  "node_modules",
  "hanzi-writer-data",
);

function getUnicode(char: string): string {
  return char.codePointAt(0)!.toString(16).toUpperCase();
}

async function main() {
  console.log("=== HSK Character Seeder ===\n");

  // 1. Get all unique characters from existing vocabulary
  const vocab = await prisma.vocabulary.findMany({
    select: { hanzi: true },
  });

  const uniqueChars = new Set<string>();
  for (const v of vocab) {
    for (const c of v.hanzi) {
      uniqueChars.add(c);
    }
  }

  const sortedChars = Array.from(uniqueChars).sort();
  console.log(`Found ${sortedChars.length} unique characters in vocabulary`);

  // 2. Check the existing character count
  const existingCount = await prisma.character.count();
  if (existingCount > 0) {
    console.log(`\nClearing ${existingCount} existing characters...`);
    await prisma.handwritingPractice.deleteMany();
    await prisma.character.deleteMany();
    console.log("  Done");
  }

  // 3. Build character entries
  let created = 0;
  let withStroke = 0;
  let batch: any[] = [];

  for (let i = 0; i < sortedChars.length; i++) {
    const char = sortedChars[i];
    const hwPath = path.join(HW_DIR, `${char}.json`);
    let strokeData: any = null;

    if (fs.existsSync(hwPath)) {
      try {
        strokeData = JSON.parse(fs.readFileSync(hwPath, "utf-8"));
        withStroke++;
      } catch {}
    }

    batch.push({
      hanzi: char,
      pinyin: "",
      meaning: "",
      radical: "",
      strokeCount: strokeData?.strokes?.length || 0,
      strokeData,
      decomposition: "",
    });

    // Batch insert every 100
    if (batch.length >= 100) {
      await prisma.character.createMany({ data: batch, skipDuplicates: true });
      created += batch.length;
      batch = [];
    }

    if ((i + 1) % 500 === 0) {
      console.log(`  Progress: ${i + 1}/${sortedChars.length}`);
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await prisma.character.createMany({ data: batch, skipDuplicates: true });
    created += batch.length;
  }

  console.log(`\n✅ Created ${created} characters`);
  console.log(`  ${withStroke} with stroke data (${(100 * withStroke / created).toFixed(0)}%)`);

  // 4. Update level character counts
  console.log("\nUpdating character counts...");
  const levels = await prisma.courseLevel.findMany();
  for (const level of levels) {
    const levelChars = new Set<string>();
    const levelVocab = await prisma.vocabulary.findMany({
      where: { levelId: level.id },
      select: { hanzi: true },
    });
    for (const v of levelVocab) {
      for (const c of v.hanzi) {
        levelChars.add(c);
      }
    }
    await prisma.courseLevel.update({
      where: { id: level.id },
      data: { totalCharacters: levelChars.size },
    });
    console.log(`  HSK ${level.level}: ${levelChars.size} unique characters`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
