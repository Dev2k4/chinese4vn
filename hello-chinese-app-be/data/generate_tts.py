import asyncio
import json
import os
import time
from pathlib import Path

import edge_tts

OUTPUT_DIR = Path("/tmp/chinese4vn_tts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
VOICE = "zh-CN-XiaoxiaoNeural"
CONCURRENCY = 5

async def generate_one(hanzi: str, vid: str, sem: asyncio.Semaphore, progress: list):
    output_path = OUTPUT_DIR / f"{vid}.mp3"
    if output_path.exists() and output_path.stat().st_size > 100:
        progress[0] += 1
        if progress[0] % 200 == 0:
            print(f"  [skip] {progress[0]}")
        return

    try:
        async with sem:
            communicate = edge_tts.Communicate(hanzi, VOICE)
            await communicate.save(str(output_path))
        progress[0] += 1
        if progress[0] % 200 == 0:
            print(f"  [done] {progress[0]}")
    except Exception as e:
        print(f"  [FAIL] {vid} ({hanzi}): {e}")


async def main():
    print("=== TTS Audio Generation ===\n")

    # Read vocabulary from DB
    import subprocess
    import sys

    # Get vocab list via TS helper
    result = subprocess.run(
        ["npx", "tsx", "-e", """
        import { PrismaClient } from '@prisma/client';
        const p = new PrismaClient();
        (async () => {
            const items = await p.vocabulary.findMany({ select: { id: true, hanzi: true } });
            console.log(JSON.stringify(items));
            await p.$disconnect();
        })();
        """],
        capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), ".."),
    )

    if result.returncode != 0:
        print("Failed to fetch vocab:", result.stderr)
        sys.exit(1)

    vocab = json.loads(result.stdout.strip())
    print(f"Loaded {len(vocab)} vocabulary items\n")

    sem = asyncio.Semaphore(CONCURRENCY)
    progress = [0]

    tasks = [generate_one(v["hanzi"], v["id"], sem, progress) for v in vocab]
    await asyncio.gather(*tasks)

    print(f"\nDone. Generated {progress[0]} audio files in {OUTPUT_DIR}")


if __name__ == "__main__":
    start = time.time()
    asyncio.run(main())
    elapsed = time.time() - start
    print(f"Total time: {elapsed:.1f}s")
