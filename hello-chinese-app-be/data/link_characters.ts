import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Link Characters ↔ Vocabulary ===\n");

  const vocabList = await prisma.vocabulary.findMany({
    select: { id: true, hanzi: true },
  });

  console.log(`Processing ${vocabList.length} vocabulary items...\n`);

  let updated = 0;
  let batchSize = 200;

  for (let i = 0; i < vocabList.length; i += batchSize) {
    const batch = vocabList.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (vocab) => {
        const chars = [];
        const seen = new Map<string, number>();

        for (let pos = 0; pos < vocab.hanzi.length; pos++) {
          const char = vocab.hanzi[pos];

          // Skip spaces and punctuation
          if (char.trim() === "" || /[^\u4e00-\u9fff]/.test(char)) continue;

          // Check cache to avoid duplicate lookups within same word
          if (seen.has(char)) {
            chars.push({ ...seen.get(char)!, position: pos });
            continue;
          }

          const record = await prisma.character.findUnique({
            where: { hanzi: char },
            select: { id: true, pinyin: true },
          });

          if (record) {
            const entry = { characterId: record.id, position: pos, pinyin: record.pinyin };
            chars.push(entry);
            seen.set(char, entry);
          }
        }

        if (chars.length > 0) {
          await prisma.vocabulary.update({
            where: { id: vocab.id },
            data: { characters: chars },
          });
        }
      }),
    );

    updated += batch.length;
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= vocabList.length) {
      console.log(`  Progress: ${Math.min(i + batchSize, vocabList.length)}/${vocabList.length}`);
    }
  }

  console.log(`\n✅ Updated ${updated} vocabulary items with character links`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
