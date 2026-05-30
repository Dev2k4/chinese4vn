#!/usr/bin/env python3
"""
Fetch character data from make-me-a-hanzi + Hanzi Writer.
Outputs JSON for seeding into Character table.
"""
import json
import os
import sys
import urllib.request
import gzip
import io

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(DATA_DIR, "hsk30-characters-processed.json")

# make-me-a-hanzi data URL (contains radicals, decomposition, etc.)
MAKEME_URL = "https://raw.githubusercontent.com/skishore/makemeahanzi/main/data/makemeahanzi.json.gz"
# Hanzi Writer data base URL (individual char files for stroke paths)
HW_BASE = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@4.0.2/data/"

def download_json_gz(url):
    """Download and parse a gzipped JSON file."""
    print(f"  Fetching {url} ...")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            raw = resp.read()
            with gzip.GzipFile(fileobj=io.BytesIO(raw)) as f:
                return json.loads(f.read().decode("utf-8"))
    except Exception as e:
        print(f"  ERROR: {e}")
        return []

def download_hw_data(char):
    """Download Hanzi Writer data for a single character."""
    code = hex(ord(char))[2:].lower()
    url = f"{HW_BASE}{code}.json"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception:
        return None

def main():
    print("=" * 60)
    print("Fetch character data")
    print("=" * 60)

    # Step 1: Load our vocabulary to know which characters we need
    vocab_path = os.path.join(DATA_DIR, "hsk30-vocab-translated.json")
    with open(vocab_path, "r", encoding="utf-8") as f:
        vocab = json.load(f)
    needed_chars = set()
    for v in vocab:
        for c in v["hanzi"]:
            needed_chars.add(c)
    print(f"\nNeed data for {len(needed_chars)} unique characters")

    # Step 2: Download make-me-a-hanzi data
    print("\n[1/3] Downloading make-me-a-hanzi data...")
    makeme = download_json_gz(MAKEME_URL)
    makeme_map = {}
    for entry in makeme:
        makeme_map[entry["character"]] = entry
    print(f"  {len(makeme_map)} characters in make-me-a-hanzi")

    # Step 3: Build character entries
    print("\n[2/3] Building character entries...")
    hw_cache = {}
    entries = []
    found = 0
    missing = 0

    for i, char in enumerate(sorted(needed_chars)):
        mm = makeme_map.get(char)

        # Get Hanzi Writer stroke data
        if char not in hw_cache:
            hw_cache[char] = download_hw_data(char)
        hw = hw_cache.get(char)

        entries.append({
            "hanzi": char,
            "pinyin": mm["pinyin"][0] if mm and mm.get("pinyin") else "",
            "meaning": mm["meaning"] if mm else "",
            "radical": mm["radical"] if mm else "",
            "strokeCount": mm["strokes"] if mm else 0,
            "decomposition": mm["decomposition"] if mm else "",
            "strokeData": hw,
        })

        if mm:
            found += 1
        else:
            missing += 1

    # Step 4: Save
    print("\n[3/3] Saving...")
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    print(f"  Saved {len(entries)} characters to {OUTPUT}")

    # Stats
    has_data = sum(1 for e in entries if e["strokeData"])
    has_pinyin = sum(1 for e in entries if e["pinyin"])
    has_radical = sum(1 for e in entries if e["radical"])
    print(f"\n  make-me-a-hanzi coverage: {found}/{len(entries)} ({100 * found // len(entries)}%)")
    print(f"  Hanzi Writer coverage:   {has_data}/{len(entries)} ({100 * has_data // len(entries)}%)")
    print(f"  With pinyin: {has_pinyin}")
    print(f"  With radical: {has_radical}")

if __name__ == "__main__":
    main()
