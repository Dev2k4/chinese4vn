/**
 * Step 4: Upload example audio to MinIO + seed VocabularyExample records.
 *
 * Input:  data/examples_with_audio.json (or examples_with_pinyin.json if no audio step)
 *         /tmp/chinese4vn_example_audio/{uuid}.mp3
 *
 * Flow:
 *   1. Upload each MP3 to MinIO at audio/examples/{uuid}.mp3
 *   2. Batch-insert all VocabularyExample records
 *   3. Update vocabulary.audioUrl for words that have examples
 *   4. Verify counts vs input
 *
 * Usage:
 *   npx tsx data/seed_examples.ts
 *   npx tsx data/seed_examples.ts --skip-audio   (if audio already on MinIO or skip)
 */

import { PrismaClient } from "@prisma/client";
import * as Minio from "minio";
import * as fs from "fs";
import * as path from "path";

// ── Config ──────────────────────────────────────────────────────
const ENV_PATH = path.join(__dirname, "..", ".env");
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const ENV = loadEnv();
const MINIO_ENDPOINT = ENV.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = Number(ENV.MINIO_PORT || "9000");
const MINIO_ACCESS_KEY = ENV.MINIO_ACCESS_KEY || "minio";
const MINIO_SECRET_KEY = ENV.MINIO_SECRET_KEY || "minio123";
const MINIO_BUCKET = ENV.MINIO_BUCKET || "hello-chinese";

const AUDIO_DIR = "/tmp/chinese4vn_example_audio";
const DATA_DIR = __dirname; // same dir as this script
// ────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

const minio = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// Track command-line flags
const SKIP_AUDIO = process.argv.includes("--skip-audio");

interface ExampleItem {
  id: string;
  sentence: string;
  pinyin: string;
  translation: string;
  order: number;
}

interface VocabEntry {
  vocabId: string;
  hanzi: string;
  pinyin: string;
  translations?: { vi?: string; en?: string };
  hskLevel?: number;
  examples: ExampleItem[];
}

async function ensureBucket() {
  const exists = await minio.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minio.makeBucket(MINIO_BUCKET);
    console.log(`  Created bucket: ${MINIO_BUCKET}`);
  }
}

async function uploadAudio(examples: { id: string; sentence: string }[]) {
  console.log(`\n[2/4] Uploading audio to MinIO...`);

  const audioDirExists = fs.existsSync(AUDIO_DIR);
  if (!audioDirExists) {
    console.log(`  Audio dir not found: ${AUDIO_DIR}, skipping upload`);
    return 0;
  }

  let uploaded = 0;
  const BATCH = 10;

  for (let i = 0; i < examples.length; i += BATCH) {
    const batch = examples.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (ex) => {
        const localPath = path.join(AUDIO_DIR, `${ex.id}.mp3`);
        if (!fs.existsSync(localPath)) return null;

        const minioPath = `audio/examples/${ex.id}.mp3`;
        try {
          await minio.putObject(
            MINIO_BUCKET,
            minioPath,
            fs.readFileSync(localPath),
            undefined,
            { "Content-Type": "audio/mpeg" },
          );
          return minioPath;
        } catch (e) {
          console.error(`  [FAIL] upload ${ex.id}:`, e);
          return null;
        }
      }),
    );

    const success = results.filter((r): r is string => r !== null);
    uploaded += success.length;

    if (uploaded % 1000 === 0 || i + BATCH >= examples.length) {
      console.log(`  Uploaded: ${uploaded}/${examples.length}`);
    }
  }

  return uploaded;
}

async function seedExamples(entries: VocabEntry[]) {
  console.log(`\n[3/4] Seeding VocabularyExample records...`);

  // Clear existing examples (they were from the basic seed)
  const existingCount = await prisma.vocabularyExample.count();
  if (existingCount > 0) {
    console.log(`  Cleaning ${existingCount} existing examples...`);
    await prisma.vocabularyExample.deleteMany();
  }

  // Collect all example records
  const records: {
    id: string;
    vocabularyId: string;
    hanzi: string;
    pinyin: string;
    translations: any;
    audioUrl: string;
    order: number;
  }[] = [];

  const vocabFirstAudio: Map<string, string> = new Map();

  for (const entry of entries) {
    for (const ex of entry.examples) {
      if (!ex.id) continue;

      records.push({
        id: ex.id,
        vocabularyId: entry.vocabId,
        hanzi: ex.sentence,
        pinyin: ex.pinyin || "",
        translations: { vi: ex.translation },
        audioUrl: `audio/examples/${ex.id}.mp3`,
        order: ex.order,
      });

      // Track first example per vocab as primary audio
      if (!vocabFirstAudio.has(entry.vocabId)) {
        vocabFirstAudio.set(entry.vocabId, `audio/examples/${ex.id}.mp3`);
      }
    }
  }

  console.log(`  Total records to insert: ${records.length}`);

  // Batch insert (500 at a time)
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await prisma.vocabularyExample.createMany({ data: batch });
    inserted += batch.length;
    if (inserted % 5000 === 0) {
      console.log(`  Inserted: ${inserted}/${records.length}`);
    }
  }
  console.log(`  ✅ Inserted ${inserted} records`);

  // Update vocabulary.audioUrl with first example
  console.log(`\n  Updating vocabulary.audioUrl (${vocabFirstAudio.size} words)...`);
  let updated = 0;
  const audioBatch = Array.from(vocabFirstAudio.entries());
  for (let i = 0; i < audioBatch.length; i += 500) {
    const batch = audioBatch.slice(i, i + 500);
    await prisma.$transaction(
      batch.map(([vocabId, audioUrl]) =>
        prisma.vocabulary.update({
          where: { id: vocabId },
          data: { audioUrl },
        }),
      ),
    );
    updated += batch.length;
  }
  console.log(`  ✅ Updated ${updated} vocabulary records`);

  return { records: records.length, vocabUpdated: updated };
}

async function verify(entries: VocabEntry[]) {
  console.log(`\n[4/4] Verifying...`);

  const dbCount = await prisma.vocabularyExample.count();
  const vocabWithExamples = await prisma.vocabulary.count({
    where: {
      examples: { some: {} },
    },
  });

  // Count words that have 3, 2, 1 examples
  const exampleDistribution = await prisma.$queryRaw<
    { count: bigint; exampleCount: bigint }[]
  >`
    SELECT COUNT(*) as count, num_examples as "exampleCount"
    FROM (
      SELECT "vocabularyId", COUNT(*) as num_examples
      FROM "VocabularyExample"
      GROUP BY "vocabularyId"
    ) sub
    GROUP BY num_examples
    ORDER BY num_examples
  `;

  const audioCount = await prisma.vocabulary.count({
    where: { audioUrl: { not: null } },
  });

  console.log(`  VocabularyExample records: ${dbCount}`);
  console.log(`  Words with examples: ${vocabWithExamples}`);
  console.log(`  Words with audioUrl: ${audioCount}`);
  for (const row of exampleDistribution) {
    console.log(`    ${row.exampleCount} examples: ${row.count} words`);
  }

  // Spot check
  const sample = await prisma.vocabularyExample.findFirst({
    include: { vocabulary: { select: { hanzi: true } } },
  });
  if (sample) {
    console.log(`\n  Sample: ${sample.vocabulary?.hanzi} → "${sample.hanzi}" (${sample.pinyin})`);
    console.log(`  Audio: ${sample.audioUrl}`);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  STEP 4: Seed Examples → MinIO + DB");
  console.log("=".repeat(60));

  // ── [1/4] Load data ──
  console.log("\n[1/4] Loading example data...");

  // Try to load the most complete file available
  let sourceFile = path.join(DATA_DIR, "examples_with_audio.json");
  if (!fs.existsSync(sourceFile)) {
    sourceFile = path.join(DATA_DIR, "examples_with_pinyin.json");
  }
  if (!fs.existsSync(sourceFile)) {
    sourceFile = path.join(DATA_DIR, "examples_raw.json");
  }
  if (!fs.existsSync(sourceFile)) {
    console.error("✗ No input files found! Run generate_examples.py first.");
    process.exit(1);
  }

  const entries: VocabEntry[] = JSON.parse(fs.readFileSync(sourceFile, "utf-8"));
  console.log(`  Loaded ${entries.length} words from ${path.basename(sourceFile)}`);

  const allExamples: { id: string; sentence: string }[] = [];
  for (const entry of entries) {
    for (const ex of entry.examples) {
      allExamples.push({ id: ex.id, sentence: ex.sentence });
    }
  }
  console.log(`  Total examples to process: ${allExamples.length}`);

  // ── Ensure MinIO bucket ──
  await ensureBucket();

  // ── Upload audio ──
  let uploaded = 0;
  if (!SKIP_AUDIO) {
    uploaded = await uploadAudio(allExamples);
  } else {
    console.log("\n[2/4] Skipping audio upload (--skip-audio)");
  }

  // ── Seed records ──
  const { records } = await seedExamples(entries);

  // ── Verify ──
  await verify(entries);

  // ── Summary ──
  console.log(`\n${"=".repeat(60)}`);
  console.log("  ✅ SEED COMPLETE");
  if (!SKIP_AUDIO) console.log(`  Audio uploaded: ${uploaded}`);
  console.log(`  DB records: ${records}`);
  console.log(`${"=".repeat(60)}`);
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
