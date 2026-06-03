#!/usr/bin/env python3
"""
Step 2: Translate Chinese→Vietnamese using deep-translator (free Google API)
Saves progress after each batch to allow resume.
"""

import json
import os
import time
from deep_translator import GoogleTranslator

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-en.json")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-translated.json")
PROGRESS_JSON = os.path.join(DATA_DIR, "vi_cache.json")

BATCH_SIZE = 100
DELAY = 0.5

def translate_batch(words, translator):
    try:
        return translator.translate_batch(words)
    except Exception as e:
        print(f"    Batch error: {e}, retrying individually...")
        results = []
        for w in words:
            try:
                r = translator.translate(w)
                results.append(r)
            except:
                results.append('')
            time.sleep(0.3)
        return results

def main():
    print("=" * 60)
    print("Step 2: Translate Chinese → Vietnamese (deep-translator)")
    print("=" * 60)

    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    print(f"Loaded {len(entries)} entries")

    vi_cache = {}
    if os.path.exists(PROGRESS_JSON):
        with open(PROGRESS_JSON, 'r', encoding='utf-8') as f:
            vi_cache = json.load(f)
        print(f"Loaded {len(vi_cache)} cached translations")

    all_hanzi = [e['hanzi'] for e in entries]
    to_translate = list(dict.fromkeys([h for h in all_hanzi if h not in vi_cache]))
    print(f"Need to translate: {len(to_translate)} unique hanzi")

    if not to_translate:
        print("Nothing to translate!")
    else:
        translator = GoogleTranslator(source='zh-CN', target='vi')
        total = len(to_translate)
        for i in range(0, total, BATCH_SIZE):
            batch = to_translate[i:i+BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1
            total_batches = (total - 1) // BATCH_SIZE + 1
            print(f"  Batch {batch_num}/{total_batches} ({i}-{i+len(batch)}/{total})...")
            
            results = translate_batch(batch, translator)
            for j, hanzi in enumerate(batch):
                if j < len(results) and results[j]:
                    vi_cache[hanzi] = results[j]
                else:
                    vi_cache[hanzi] = ''
            
            with open(PROGRESS_JSON, 'w', encoding='utf-8') as f:
                json.dump(vi_cache, f, ensure_ascii=False)
            
            time.sleep(DELAY)

    # Combine
    vi_count = 0
    for e in entries:
        vi = vi_cache.get(e['hanzi'], '')
        translations = {}
        if vi:
            translations['vi'] = vi
            vi_count += 1
        if e['en']:
            translations['en'] = e['en']
        e['translations'] = translations if translations else None
        del e['en']

    by_level = {}
    for e in entries:
        l = e['level']
        by_level.setdefault(l, {'total': 0, 'vi': 0})
        by_level[l]['total'] += 1
        if e['translations'] and e['translations'].get('vi'):
            by_level[l]['vi'] += 1

    print("\nFinal stats:")
    for lvl in sorted(by_level.keys()):
        s = by_level[lvl]
        print(f"  HSK {lvl}: {s['total']} words, {s['vi']} with Vietnamese")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    print(f"\n✅ {OUTPUT_JSON}")

if __name__ == '__main__':
    main()
