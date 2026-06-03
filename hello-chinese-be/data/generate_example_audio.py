"""
Step 3: Generate TTS audio for example sentences using edge_tts.
Input:  data/examples_with_pinyin.json
Output: /tmp/chinese4vn_example_audio/{uuid}.mp3
        data/examples_with_audio.json
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

import edge_tts

INPUT = Path(__file__).parent / "examples_with_pinyin.json"
OUTPUT = Path(__file__).parent / "examples_with_audio.json"
AUDIO_DIR = Path("/tmp/chinese4vn_example_audio")

VOICE = "zh-CN-XiaoxiaoNeural"
CONCURRENCY = 10


async def generate_one(uuid_str: str, sentence: str, sem: asyncio.Semaphore, progress: dict):
    output_path = AUDIO_DIR / f"{uuid_str}.mp3"
    if output_path.exists() and output_path.stat().st_size > 100:
        progress["skipped"] += 1
        if progress["skipped"] % 500 == 0:
            print(f"  [skip] {progress['done'] + progress['skipped']}/{progress['total']}")
        return uuid_str

    try:
        async with sem:
            communicate = edge_tts.Communicate(sentence, VOICE)
            await communicate.save(str(output_path))
        progress["done"] += 1
        if progress["done"] % 200 == 0:
            print(f"  [done] {progress['done']}/{progress['total']}")
        return uuid_str
    except Exception as e:
        print(f"  [FAIL] {uuid_str} ({sentence[:20]}...): {e}")
        progress["failed"] += 1
        return None


async def main():
    print("=" * 60)
    print("  STEP 3: Generate Example Audio (edge_tts)")
    print(f"  Input: {INPUT}")
    print(f"  Voice: {VOICE}")
    print(f"  Concurrency: {CONCURRENCY}")
    print(f"  Output dir: {AUDIO_DIR}")
    print("=" * 60)

    if not INPUT.exists():
        print(f"\n✗ Input file not found: {INPUT}")
        print("  Run generate_pinyin.py first!")
        sys.exit(1)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print("\n[1/3] Loading examples...")
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    print(f"  Loaded {len(data)} words")

    # Collect all example sentences
    all_examples = []
    for entry in data:
        for ex in entry.get("examples", []):
            all_examples.append({
                "id": ex["id"],
                "sentence": ex["sentence"],
            })

    total = len(all_examples)
    print(f"  Total examples to process: {total}")

    print("\n[2/3] Checking existing audio files...")
    existing = set()
    if AUDIO_DIR.exists():
        existing = {f.replace(".mp3", "") for f in os.listdir(str(AUDIO_DIR)) if f.endswith(".mp3")}
    print(f"  Already have audio: {len(existing)} files")

    todo = [e for e in all_examples if e["id"] not in existing]
    print(f"  Need to generate: {len(todo)} files")

    if not todo:
        print("\n✅ All audio files already generated!")
        # Still save the output JSON
    else:
        print(f"\n[3/3] Generating audio ({len(todo)} files)...")
        sem = asyncio.Semaphore(CONCURRENCY)
        progress = {"done": 0, "skipped": 0, "failed": 0, "total": len(todo)}
        start_time = time.time()

        tasks = [generate_one(ex["id"], ex["sentence"], sem, progress) for ex in todo]
        results = await asyncio.gather(*tasks)

        elapsed = time.time() - start_time
        successful = sum(1 for r in results if r is not None)

        print(f"\n  Generated: {successful}, Skipped: {progress['skipped']}, Failed: {progress['failed']}")
        print(f"  Time: {elapsed/60:.1f} min")

    # Save final metadata
    print("\nSaving metadata...")
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n{'=' * 60}")
    print(f"  ✅ DONE")
    print(f"  Output: {OUTPUT}")
    print(f"  Audio dir: {AUDIO_DIR} ({len(os.listdir(str(AUDIO_DIR)))} files)")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
