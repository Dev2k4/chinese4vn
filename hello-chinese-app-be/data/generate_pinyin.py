"""
Step 2: Generate pinyin for all example sentences using pypinyin.
Input:  data/examples_raw.json
Output: data/examples_with_pinyin.json

Also generates a UUID for each example (used as audio filename and DB record ID).
"""

import json
import uuid
import time
from pathlib import Path
from pypinyin import pinyin, Style

INPUT = Path(__file__).parent / "examples_raw.json"
OUTPUT = Path(__file__).parent / "examples_with_pinyin.json"


def add_pinyin(sentence: str) -> str:
    """Convert Chinese sentence to pinyin with tone marks."""
    try:
        chars = []
        for char in sentence:
            # Skip non-Chinese characters
            if ord(char) < 0x4E00 or ord(char) > 0x9FFF:
                chars.append(char)
            else:
                py = pinyin(char, style=Style.TONE)
                chars.append(py[0][0] if py else char)
        return "".join(chars)
    except Exception as e:
        print(f"  ⚠ pinyin error: {sentence[:20]}... → {e}")
        return ""


def main():
    print("=" * 60)
    print("  STEP 2: Generate Pinyin")
    print(f"  Input: {INPUT}")
    print(f"  Output: {OUTPUT}")
    print("=" * 60)

    if not INPUT.exists():
        print(f"\n✗ Input file not found: {INPUT}")
        print("  Run generate_examples.py first!")
        sys.exit(1)

    print("\n[1/2] Loading examples...")
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    print(f"  Loaded {len(data)} words")

    print("\n[2/2] Generating pinyin + UUIDs...")
    start = time.time()
    total_examples = 0

    for entry in data:
        for ex in entry.get("examples", []):
            ex["id"] = str(uuid.uuid4())
            ex["pinyin"] = add_pinyin(ex["sentence"])
            total_examples += 1

    elapsed = time.time() - start
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n{'=' * 60}")
    print(f"  ✅ DONE in {elapsed:.1f}s")
    print(f"  Words: {len(data)}")
    print(f"  Examples: {total_examples}")
    print(f"  Output: {OUTPUT}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    import sys
    main()
