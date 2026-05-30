import { PrismaClient } from "@prisma/client";
import * as Minio from "minio";
import * as fs from "fs";
import * as path from "path";

const ENV_PATH = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(ENV_PATH, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const AUDIO_DIR = "/tmp/chinese4vn_tts";
const BUCKET = env.MINIO_BUCKET || "hello-chinese";

const minio = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT || "localhost",
  port: Number(env.MINIO_PORT || "9000"),
  useSSL: (env.MINIO_USE_SSL || "false") === "true",
  accessKey: env.MINIO_ACCESS_KEY || "minio",
  secretKey: env.MINIO_SECRET_KEY || "minio123",
});

const prisma = new PrismaClient();
const CONCURRENCY = 10;

async function main() {
  console.log("=== Upload Audio to MinIO ===\n");

  const exists = await minio.bucketExists(BUCKET);
  if (!exists) {
    await minio.makeBucket(BUCKET);
    console.log(`Created bucket: ${BUCKET}`);
  }

  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3"));
  const ids = files.map((f) => f.replace(".mp3", ""));
  console.log(`Found ${ids.length} audio files to upload\n`);

  let uploaded = 0;
  const allResults: { id: string; minioPath: string }[] = [];

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (id) => {
        const filePath = path.join(AUDIO_DIR, `${id}.mp3`);
        const minioPath = `audio/vocabulary/${id}.mp3`;
        try {
          await minio.putObject(BUCKET, minioPath, fs.readFileSync(filePath), undefined, {
            "Content-Type": "audio/mpeg",
          });
          return { id, minioPath };
        } catch (e) {
          console.error(`  [FAIL] ${id}:`, e);
          return null;
        }
      }),
    );

    const updates = results.filter((r): r is { id: string; minioPath: string } => r !== null);
    allResults.push(...updates);
    uploaded += updates.length;

    if (uploaded % 1000 === 0 || i + CONCURRENCY >= ids.length) {
      console.log(`  Uploaded: ${uploaded}/${ids.length}`);
    }
  }

  console.log(`\nUpdating ${allResults.length} vocabulary records...`);
  for (let i = 0; i < allResults.length; i += 500) {
    const batch = allResults.slice(i, i + 500);
    await prisma.$transaction(
      batch.map(({ id, minioPath }) =>
        prisma.vocabulary.update({ where: { id }, data: { audioUrl: minioPath } }),
      ),
    );
  }

  console.log(`\n✅ Uploaded ${uploaded} audio files to MinIO`);
  console.log(`   Updated ${allResults.length} vocabulary records with audioUrl`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
