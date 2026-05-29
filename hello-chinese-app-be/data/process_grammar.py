#!/usr/bin/env python3
"""
Parse profesorm grammar JSON → translate + output JSON for seed.
"""
import json
import os
import sys
import time
from urllib.parse import quote
from http.client import HTTPSConnection

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_JSON = os.path.join(DATA_DIR, "hsk_grammar_pretty.json")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-grammar-processed.json")
CACHE_JSON = os.path.join(DATA_DIR, "grammar_vi_cache.json")

def translate(text, src='zh-CN', dest='vi', retries=3):
    for attempt in range(retries):
        try:
            conn = HTTPSConnection('translate.googleapis.com', timeout=10)
            url = f'/translate_a/single?client=gtx&sl={src}&tl={dest}&dt=t&q={quote(text)}'
            conn.request('GET', url)
            resp = conn.getresponse()
            data = resp.read().decode('utf-8')
            conn.close()
            if data and data != 'null':
                parsed = json.loads(data)
                if parsed and len(parsed) > 0 and len(parsed[0]) > 0 and parsed[0][0]:
                    return parsed[0][0][0]
        except:
            if attempt < retries - 1:
                time.sleep(2)
    return ''

def main():
    print("Parsing grammar data...")
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    records = data['data']['records']
    print(f"Total: {len(records)} grammar records")

    # Load translation cache
    cache = {}
    if os.path.exists(CACHE_JSON):
        with open(CACHE_JSON, 'r', encoding='utf-8') as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached translations")

    # Map level
    level_map = {
        'HSK1': 1, 'HSK2': 2, 'HSK3': 3, 'HSK4': 4,
        'HSK5': 5, 'HSK6': 6, 'HSK7-9': 7,
    }

    output = []
    need_translate = set()

    for r in records:
        lvl = level_map.get(r.get('examLevelId', ''), 7)
        content = r.get('content', '').strip()
        gtype = r.get('grammarType', '').strip()
        cat = r.get('categoryType', '').strip()
        detail = r.get('grammarDetail', '').strip()
        cases_raw = r.get('cases', '').strip()

        # Build title
        title_text = content
        if detail:
            title_text = f"{detail}：{content}"
        elif cat:
            if gtype == '词类' or gtype == '语素':
                title_text = f"{cat}：{content}"
            else:
                title_text = f"{cat}：{content}"
        
        # Build explanation
        explanation_parts = [gtype]
        if cat:
            explanation_parts.append(cat)
        if detail:
            explanation_parts.append(detail)
        explanation_text = ' - '.join(explanation_parts)

        # Parse cases into structured examples
        examples = []
        if cases_raw:
            for line in cases_raw.split('\r\n'):
                line = line.strip()
                if line:
                    # Try to extract pinyin via separate translation later
                    examples.append({'hanzi': line, 'pinyin': '', 'translations': {}})

        entry = {
            'level': lvl,
            'title': title_text,
            'explanation': explanation_text,
            'structure': content,
            'grammarType': gtype,
            'category': cat,
            'detail': detail,
            'examples': examples,
        }
        output.append(entry)
        need_translate.add(title_text)
        need_translate.add(explanation_text)

    print(f"Need to translate ~{min(len(need_translate)*2, 200)} text snippets")

    # Translate titles and explanations
    to_translate = list(need_translate)
    cache_updated = False
    
    for i, text in enumerate(to_translate):
        if text in cache:
            continue
        r = translate(text)
        cache[text] = r or ''
        cache_updated = True
        if (i + 1) % 50 == 0:
            with open(CACHE_JSON, 'w', encoding='utf-8') as f:
                json.dump(cache, f, ensure_ascii=False)
            print(f"  Translated {i+1}/{len(to_translate)}", flush=True)
        time.sleep(0.15)

    if cache_updated:
        with open(CACHE_JSON, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False)

    # Also translate examples where needed
    example_sentences = set()
    for e in output:
        for ex in e['examples']:
            example_sentences.add(ex['hanzi'])
    
    example_cache = {}
    ex_cache_path = os.path.join(DATA_DIR, "grammar_examples_cache.json")
    if os.path.exists(ex_cache_path):
        with open(ex_cache_path, 'r', encoding='utf-8') as f:
            example_cache = json.load(f)
    
    ex_list = [s for s in example_sentences if s and s not in example_cache]
    print(f"Translating {len(ex_list)} example sentences...")
    for i, s in enumerate(ex_list):
        r = translate(s)
        if r:
            example_cache[s] = r
        if (i + 1) % 50 == 0:
            with open(ex_cache_path, 'w', encoding='utf-8') as f:
                json.dump(example_cache, f, ensure_ascii=False)
            print(f"  Examples: {i+1}/{len(ex_list)}", flush=True)
        time.sleep(0.15)

    with open(ex_cache_path, 'w', encoding='utf-8') as f:
        json.dump(example_cache, f, ensure_ascii=False)

    # Build final entries with translations
    final = []
    for e in output:
        title_en = translate(e['title'], 'zh-CN', 'en')  # also get English
        time.sleep(0.15)
        expl_en = translate(e['explanation'], 'zh-CN', 'en')
        time.sleep(0.15)

        translations = {
            'title': {'vi': cache.get(e['title'], ''), 'en': title_en or ''},
            'explanation': {'vi': cache.get(e['explanation'], ''), 'en': expl_en or ''},
            'structure': {'vi': cache.get(e['title'], ''), 'en': title_en or ''},
        }

        translated_examples = []
        for ex in e['examples']:
            vi = example_cache.get(ex['hanzi'], '')
            translated_examples.append({
                'hanzi': ex['hanzi'],
                'pinyin': '',
                'translations': {'vi': vi, 'en': ''} if vi else {},
            })

        final.append({
            'level': e['level'],
            'translations': translations,
            'examples': translated_examples,
            'grammarType': e['grammarType'],
            'category': e['category'],
        })

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Saved {len(final)} grammar entries to {OUTPUT_JSON}")

if __name__ == '__main__':
    main()
