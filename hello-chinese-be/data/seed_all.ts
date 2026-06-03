import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runScript(name: string, path: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log(`${'='.repeat(60)}`);
  try {
    // Use ts-node to run the script
    const { execSync } = require("child_process");
    execSync(`npx ts-node ${path}`, {
      stdio: "inherit",
      cwd: __dirname + "/..",
      env: { ...process.env },
    });
    console.log(`✅ ${name} completed successfully`);
  } catch (e: any) {
    console.error(`❌ ${name} failed:`, e.message);
    throw e;
  }
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  HSK 3.0 MASTER SEED`);
  console.log(`  Seeding all content: vocabulary, grammar, questions, lessons`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();

  // ── Step 1: Base seed (framework, levels, paths, test user) ──
  await runScript("Base seed (HSK framework + levels + test user)", "prisma/seed.ts");

  // ── Step 2: Seed vocabulary (11,044 words) ──
  await runScript("Vocabulary seeder", "data/seed_vocab.ts");

  // ── Step 3: Seed grammar points (593 points) ──
  await runScript("Grammar seeder", "data/seed_grammar.ts");

  // ── Step 4: Seed questions (33,132 questions) ──
  await runScript("Question seeder", "data/seed_questions.ts");

  // ── Step 5: Create lessons and learning path structure ──
  await runScript("Lesson creator", "data/create_lessons.ts");

  // ── Step 6: Assign questions to mock tests ──
  await runScript("Mock test question assigner", "data/seed_mocktests.ts");

  // ── Final verification ──
  console.log(`\n${'='.repeat(60)}`);
  console.log("  VERIFICATION");
  console.log(`${'='.repeat(60)}`);

  const levels = await prisma.courseLevel.findMany({ orderBy: { level: "asc" } });
  const framework = await prisma.courseFramework.findFirst({ where: { code: "HSK" } });

  let totalWords = 0;
  let totalGrammar = 0;
  let totalQuestions = 0;
  let totalLessons = 0;
  let totalUnits = 0;

  for (const l of levels) {
    const words = await prisma.vocabulary.count({ where: { levelId: l.id } });
    const grammar = await prisma.grammarPoint.count({ where: { levelId: l.id } });
    const units = await prisma.unit.count({ where: { levelId: l.id } });
    const lessons = await prisma.lesson.count({ where: { unit: { levelId: l.id } } });
    totalWords += words;
    totalGrammar += grammar;
    totalLessons += lessons;
    totalUnits += units;
    console.log(`  HSK ${l.level}: ${words} words, ${grammar} grammar, ${units} units, ${lessons} lessons`);
  }

  totalQuestions = await prisma.question.count();
  const mockTests = await prisma.mockTest.count();
  const users = await prisma.user.count();

  console.log(`\n  Total: ${totalWords} words, ${totalGrammar} grammar, ${totalQuestions} questions`);
  console.log(`  ${totalUnits} units, ${totalLessons} lessons, ${mockTests} mock tests`);
  console.log(`  ${users} users`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Master seed completed in ${elapsed}s`);
}

main()
  .catch((e) => {
    console.error("\n❌ Master seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
