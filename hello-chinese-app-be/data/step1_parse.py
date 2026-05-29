#!/usr/bin/env python3
"""
Step 1: Parse CSV + CC-CEDICT → build vocab entries with English definitions
"""

import csv
import gzip
import json
import os
import re
from collections import defaultdict

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(DATA_DIR, "hsk30-expanded.csv")
CEDICT_GZ_PATH = os.path.join(DATA_DIR, "cedict.gz")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-en.json")

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

def parse_cedict():
    lookup = defaultdict(list)
    pat = re.compile(r'^(\S+) (\S+) \[([^\]]+)\] /(.+)/$')
    with gzip.open(CEDICT_GZ_PATH, 'rt', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#'):
                continue
            m = pat.match(line.strip())
            if not m:
                continue
            simp = m.group(2)
            defs = m.group(4).split('/')
            lookup[simp].append({
                'pinyin': m.group(3),
                'definitions': [d.strip() for d in defs if d.strip()],
                'traditional': m.group(1),
            })
    print(f"  CC-CEDICT: {len(lookup)} unique simplified words")
    return lookup

def lookup_cedict(simp, cedict):
    entries = cedict.get(simp, [])
    if not entries:
        return None
    defs = entries[0]['definitions']
    return '; '.join(defs) if defs else None

def pos_to_json(pos_str):
    if not pos_str or pos_str.strip() == '':
        return None
    parts = re.split(r'[/,]', pos_str)
    vi_parts, en_parts = [], []
    for p in parts:
        p = p.strip()
        if p in POS_MAP:
            vi_parts.append(POS_MAP[p]['vi'])
            en_parts.append(POS_MAP[p]['en'])
        else:
            vi_parts.append(p)
            en_parts.append(p)
    return {"vi": ", ".join(vi_parts), "en": ", ".join(en_parts)}

def main():
    print("=" * 60)
    print("Step 1: Parse HSK30 + CC-CEDICT")
    print("=" * 60)

    print("\n[1/2] Parsing CC-CEDICT...")
    cedict = parse_cedict()

    print("\n[2/2] Parsing HSK30 CSV & building entries...")
    entries = []
    hanzi_set = set()
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hanzi = row['Simplified'].strip()
            if not hanzi:
                continue
            level_str = row['Level'].strip()
            level = 7 if level_str == '7-9' else int(level_str)
            pinyin = row['Pinyin'].strip()
            pos_str = row.get('POS', '').strip()
            key = (hanzi, pinyin)
            if key in hanzi_set:
                continue
            hanzi_set.add(key)
            en_def = lookup_cedict(hanzi, cedict)
            entries.append({
                'hanzi': hanzi,
                'pinyin': pinyin,
                'level': level,
                'pos': pos_str,
                'wordClass': pos_to_json(pos_str),
                'en': en_def or '',
            })

    print(f"  {len(entries)} unique entries")

    by_level = defaultdict(list)
    for e in entries:
        by_level[e['level']].append(e)
    for lvl in sorted(by_level.keys()):
        with_en = sum(1 for e in by_level[lvl] if e['en'])
        print(f"  HSK {lvl}: {len(by_level[lvl])} words ({with_en} with English)")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    print(f"\n✅ {OUTPUT_JSON}")

if __name__ == '__main__':
    main()
