#!/usr/bin/env python3
"""
Step 3: Combine English definitions + Vietnamese translations.
For missing Vietnamese, generate from CC-CEDICT English → Vietnamese.
"""

import json
import os
import time
import re

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-en.json")
CACHE_JSON = os.path.join(DATA_DIR, "vi_cache.json")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-translated.json")

def translate_with_retry(word, src, dest, max_retries=3):
    from deep_translator import GoogleTranslator
    for attempt in range(max_retries):
        try:
            t = GoogleTranslator(source=src, target=dest)
            result = t.translate(word)
            if result:
                return result
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)
    return ''

def main():
    print("=" * 60)
    print("Step 3: Finalize translations (with resume)")
    print("=" * 60)

    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    print(f"Loaded {len(entries)} entries")

    # Load cached Vietnamese translations (from step2)
    vi_cache = {}
    if os.path.exists(CACHE_JSON):
        with open(CACHE_JSON, 'r', encoding='utf-8') as f:
            vi_cache = json.load(f)
        print(f"Loaded {len(vi_cache)} cached Vietnamese translations")

    # Find words needing Vietnamese translation
    need_vi = [e for e in entries if e['hanzi'] not in vi_cache]
    print(f"Missing Vietnamese: {len(need_vi)} / {len(entries)}")

    # For missing ones, try translating English → Vietnamese
    # But only if they have an English definition
    en_to_translate = [e for e in need_vi if e['en']]
    # Also try Chinese → Vietnamese for the rest
    cn_to_translate = [e for e in need_vi if not e['en']]

    if en_to_translate:
        print(f"\nTranslating {len(en_to_translate)} English→Vietnamese...")
        for i, e in enumerate(en_to_translate):
            # Use first sentence/part of English definition for translation
            en_text = e['en'].split(';')[0].strip()
            result = translate_with_retry(en_text, 'en', 'vi')
            if result:
                vi_cache[e['hanzi']] = result
            else:
                vi_cache[e['hanzi']] = ''
            
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/{len(en_to_translate)}")
                with open(CACHE_JSON, 'w', encoding='utf-8') as f:
                    json.dump(vi_cache, f, ensure_ascii=False)
            time.sleep(0.3)

    if cn_to_translate:
        print(f"\nTranslating {len(cn_to_translate)} Chinese→Vietnamese...")
        for i, e in enumerate(cn_to_translate):
            result = translate_with_retry(e['hanzi'], 'zh-CN', 'vi')
            if result:
                vi_cache[e['hanzi']] = result
            else:
                vi_cache[e['hanzi']] = ''
            
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/{len(cn_to_translate)}")
                with open(CACHE_JSON, 'w', encoding='utf-8') as f:
                    json.dump(vi_cache, f, ensure_ascii=False)
            time.sleep(0.3)

    # Build final output
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

    # Save final cache
    with open(CACHE_JSON, 'w', encoding='utf-8') as f:
        json.dump(vi_cache, f, ensure_ascii=False)

if __name__ == '__main__':
    main()
