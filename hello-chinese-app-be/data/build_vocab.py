#!/usr/bin/env python3
"""
Pipeline: parse ivankra/hsk30 CSV + CC-CEDICT → English definitions → Google Translate Vietnamese → JSON cache + seed
"""

import csv
import gzip
import json
import os
import re
import time
import sys
from collections import defaultdict

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(DATA_DIR, "hsk30-expanded.csv")
CEDICT_GZ_PATH = os.path.join(DATA_DIR, "cedict.gz")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-processed.json")
PROGRESS_JSON = os.path.join(DATA_DIR, "hsk30-translation-progress.json")

POS_MAP = {
    "V":    {"vi": "động từ", "en": "verb"},
    "N":    {"vi": "danh từ", "en": "noun"},
    "Adj":  {"vi": "tính từ", "en": "adjective"},
    "Adv":  {"vi": "trạng từ", "en": "adverb"},
    "Pron": {"vi": "đại từ", "en": "pronoun"},
    "Num":  {"vi": "số từ", "en": "numeral"},
    "M":    {"vi": "lượng từ", "en": "measure word"},
    "Prep": {"vi": "giới từ", "en": "preposition"},
    "Conj": {"vi": "liên từ", "en": "conjunction"},
    "Part": {"vi": "trợ từ", "en": "particle"},
    "Aux":  {"vi": "trợ động từ", "en": "auxiliary verb"},
    "Int":  {"vi": "thán từ", "en": "interjection"},
    "ON":   {"vi": "từ tượng thanh", "en": "onomatopoeia"},
    "Pref": {"vi": "tiền tố", "en": "prefix"},
    "Suff": {"vi": "hậu tố", "en": "suffix"},
}

# ── 1. Parse CC-CEDICT ──────────────────────────────────────────
def parse_cedict():
    """Parse CC-CEDICT gz → dict[simplified] = [def1, def2, ...]"""
    lookup = defaultdict(list)
    pat = re.compile(r'^(\S+) (\S+) \[([^\]]+)\] /(.+)/$')
    skipped = 0
    with gzip.open(CEDICT_GZ_PATH, 'rt', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#'):
                continue
            m = pat.match(line.strip())
            if not m:
                skipped += 1
                continue
            trad, simp, pinyin, defs = m.group(1), m.group(2), m.group(3), m.group(4)
            # Normalize pinyin: remove tone numbers, keep tone marks
            lookup[simp].append({
                'pinyin': pinyin,
                'definitions': defs.split('/'),
                'traditional': trad,
            })
    if skipped:
        print(f"  CC-CEDICT: skipped {skipped} unparseable lines")
    print(f"  CC-CEDICT: {len(lookup)} unique simplified words")
    return lookup

def lookup_cedict(simp, cedict):
    """Best-match English definition from CC-CEDICT for a simplified word."""
    entries = cedict.get(simp, [])
    if not entries:
        return None
    # Prefer entries where pinyin matches most closely? Just use first for simplicity
    defs = entries[0]['definitions']
    # Join definitions, but filter out empty ones
    clean = [d.strip() for d in defs if d.strip()]
    return '; '.join(clean) if clean else None

# ── 2. Parse HSK30 CSV ──────────────────────────────────────────
def parse_hsk_csv():
    """Parse expanded CSV → list of dicts (one per variant)."""
    rows = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    print(f"  HSK CSV: {len(rows)} rows")
    return rows

def pos_to_json(pos_str):
    """Convert POS string like 'V/N' to JSON translation object."""
    if not pos_str or pos_str.strip() == '':
        return None
    parts = re.split(r'[/,]', pos_str)
    vi_parts = []
    en_parts = []
    for p in parts:
        p = p.strip()
        if p in POS_MAP:
            vi_parts.append(POS_MAP[p]['vi'])
            en_parts.append(POS_MAP[p]['en'])
        else:
            vi_parts.append(p)
            en_parts.append(p)
    return {
        "vi": ", ".join(vi_parts),
        "en": ", ".join(en_parts),
    }

# ── 3. Translate using Google Translate ─────────────────────────
def batch_translate(words_batch, src='zh-cn', dest='vi'):
    """Translate a batch of Chinese words to Vietnamese using googletrans."""
    from googletrans import Translator
    translator = Translator()
    result = {}
    # googletrans free API has limits; we'll try batch translate
    try:
        translations = translator.translate(words_batch, src=src, dest=dest)
        for i, t in enumerate(translations):
            if t and t.text:
                result[words_batch[i]] = t.text
    except Exception as e:
        print(f"    Batch translate error: {e}")
        # Fall back to individual translation
        for word in words_batch:
            try:
                t = translator.translate(word, src=src, dest=dest)
                if t and t.text:
                    result[word] = t.text
            except Exception as e2:
                print(f"    Error translating '{word}': {e2}")
            time.sleep(0.5)
    return result

# ── 4. Main pipeline ────────────────────────────────────────────
def main():
    print("=" * 60)
    print("HSK 3.0 Vocabulary Pipeline")
    print("=" * 60)

    # Step 1: Parse CC-CEDICT
    print("\n[1/4] Parsing CC-CEDICT...")
    cedict = parse_cedict()

    # Step 2: Parse HSK CSV
    print("\n[2/4] Parsing HSK30 CSV...")
    csv_rows = parse_hsk_csv()

    # Step 3: Build vocabulary entries with English definitions
    print("\n[3/4] Building vocabulary entries...")
    entries = []
    hanzi_set = set()
    for row in csv_rows:
        hanzi = row['Simplified'].strip()
        if not hanzi:
            continue
        level_str = row['Level'].strip()
        if level_str == '7-9':
            level = 7
        else:
            level = int(level_str)
        pinyin = row['Pinyin'].strip()
        pos_str = row.get('POS', '').strip()
        
        # Deduplicate by hanzi+pinyin (CSV has expanded variants like 爸爸 and 爸)
        key = (hanzi, pinyin)
        if key in hanzi_set:
            continue
        hanzi_set.add(key)

        # Get English from CC-CEDICT
        en_def = lookup_cedict(hanzi, cedict)
        
        entries.append({
            'hanzi': hanzi,
            'pinyin': pinyin,
            'level': level,
            'pos': pos_str,
            'posJson': pos_to_json(pos_str),
            'en': en_def or '',
        })

    print(f"  {len(entries)} unique entries built")
    
    # Stats
    with_en = sum(1 for e in entries if e['en'])
    print(f"  With English definitions: {with_en} / {len(entries)} ({100*with_en//len(entries)}%)")

    # Step 4: Translate to Vietnamese (Chinese → Vietnamese)
    print("\n[4/4] Translating to Vietnamese...")
    
    # Load progress cache if exists
    vi_cache = {}
    if os.path.exists(PROGRESS_JSON):
        with open(PROGRESS_JSON, 'r', encoding='utf-8') as f:
            vi_cache = json.load(f)
        print(f"  Loaded {len(vi_cache)} cached Vietnamese translations")

    # Find words needing translation
    to_translate = [e for e in entries if e['hanzi'] not in vi_cache]
    print(f"  Need translation: {len(to_translate)} / {len(entries)} words")

    if to_translate:
        BATCH_SIZE = 100
        DELAY = 2.0  # seconds between batches
        
        for i in range(0, len(to_translate), BATCH_SIZE):
            batch = to_translate[i:i+BATCH_SIZE]
            hanzi_batch = [e['hanzi'] for e in batch]
            print(f"  Translating batch {i//BATCH_SIZE + 1}/{(len(to_translate)-1)//BATCH_SIZE + 1} ({i}-{i+len(batch)})...")
            
            try:
                result = batch_translate(hanzi_batch)
                for hanzi, vi_text in result.items():
                    vi_cache[hanzi] = vi_text
            except Exception as e:
                print(f"  Batch failed: {e}")
            
            # Save progress after each batch
            with open(PROGRESS_JSON, 'w', encoding='utf-8') as f:
                json.dump(vi_cache, f, ensure_ascii=False)
            
            time.sleep(DELAY)

    # Step 5: Build final output
    print("\nBuilding final vocabulary list...")
    vocab_list = []
    for e in entries:
        hanzi = e['hanzi']
        vi_text = vi_cache.get(hanzi, '')
        
        translations = {}
        if vi_text:
            translations['vi'] = vi_text
        if e['en']:
            translations['en'] = e['en']
        
        vocab_list.append({
            'hanzi': hanzi,
            'pinyin': e['pinyin'],
            'level': e['level'],
            'pos': e['pos'],
            'wordClass': e['posJson'],
            'translations': translations if translations else None,
        })

    # Group by level for statistics
    by_level = defaultdict(list)
    for v in vocab_list:
        by_level[v['level']].append(v)
    
    print("\nFinal statistics:")
    for lvl in sorted(by_level.keys()):
        with_vi = sum(1 for v in by_level[lvl] if v['translations'] and v['translations'].get('vi'))
        print(f"  HSK {lvl}: {len(by_level[lvl])} words ({with_vi} with Vietnamese)")

    # Write output
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(vocab_list, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Output saved to {OUTPUT_JSON}")
    print(f"   Total vocabularies: {len(vocab_list)}")

if __name__ == '__main__':
    main()
