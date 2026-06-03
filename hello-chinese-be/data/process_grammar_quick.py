#!/usr/bin/env python3
"""
Quick grammar processor - output seedable JSON with placeholder translations.
Skips heavy translation for speed; sets vi to Chinese text as fallback.
"""
import json
import os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(DATA_DIR, "hsk_grammar_pretty.json")
OUTPUT = os.path.join(DATA_DIR, "hsk30-grammar-seed-ready.json")

level_map = {
    'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4,
    'HSK5': 5, 'HSK6': 6, 'HSK7-9': 7,
}

data = json.load(open(INPUT, 'r', encoding='utf-8'))
records = data['data']['records']
print(f"Total: {len(records)} records")

# Load cached Vi translations if available
vi_cache = {}
ex_cache = {}
for p in ['grammar_vi_cache.json', 'grammar_examples_cache.json']:
    fpath = os.path.join(DATA_DIR, p)
    if os.path.exists(fpath):
        try:
            c = json.load(open(fpath, 'r', encoding='utf-8'))
            if 'grammar_vi' in p:
                vi_cache = c
            else:
                ex_cache = c
        except:
            pass

print(f"Loaded {len(vi_cache)} title/explanation + {len(ex_cache)} example translations")

output = []
for r in records:
    lvl = level_map.get(r.get('examLevelId', ''), 7)
    content = r.get('content', '').strip()
    gtype = r.get('grammarType', '').strip()
    cat = r.get('categoryType', '').strip()
    detail = r.get('grammarDetail', '').strip()
    cases = r.get('cases', '').strip()

    # Build title from parts
    title_parts = [p for p in [gtype, cat, detail, content] if p]
    title_zh = ' - '.join(title_parts)

    # Get or create translations
    title_vi = vi_cache.get(title_zh, '') or title_zh
    expl_vi = vi_cache.get(gtype, '') or (f"{gtype} - {cat}" if cat else gtype)

    # Parse examples
    examples = []
    if cases:
        for line in cases.split('\r\n'):
            line = line.strip()
            if line:
                ex_vi = ex_cache.get(line, '')
                examples.append({
                    'hanzi': line,
                    'pinyin': '',
                    'translations': {'vi': ex_vi} if ex_vi else {},
                })

    output.append({
        'level': lvl,
        'title': {
            'vi': title_vi,
            'en': content,
        },
        'explanation': {
            'vi': expl_vi,
            'en': f"{gtype} - {cat}" if cat else gtype,
        },
        'structure': {
            'vi': content,
            'en': content,
        },
        'examples': examples,
        'grammarType': gtype,
        'order': len(output) + 1,
    })

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ {len(output)} grammar entries -> {OUTPUT}")

by_lvl = {}
for e in output:
    by_lvl.setdefault(e['level'], 0)
    by_lvl[e['level']] += 1
for lvl in sorted(by_lvl):
    print(f"  HSK {lvl}: {by_lvl[lvl]} entries")
