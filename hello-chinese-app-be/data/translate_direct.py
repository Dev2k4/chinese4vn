#!/usr/bin/env python3
"""
Translate all missing hanzi → Vietnamese via direct Google Translate HTTP API.
Saves progress to vi_cache.json after every 50 words.
"""

import json
import os
import time
from urllib.parse import quote
from http.client import HTTPSConnection

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-en.json")
CACHE_JSON = os.path.join(DATA_DIR, "vi_cache.json")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-translated.json")

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
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
    return ''

def main():
    print("Translation starting...", flush=True)
    
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        entries = json.load(f)

    vi_cache = {}
    if os.path.exists(CACHE_JSON):
        with open(CACHE_JSON, 'r', encoding='utf-8') as f:
            vi_cache = json.load(f)

    missing = list(dict.fromkeys([e['hanzi'] for e in entries if e['hanzi'] not in vi_cache]))
    total = len(missing)
    print(f"Need {total}/{len(entries)} words", flush=True)

    start_time = time.time()
    for i, hanzi in enumerate(missing):
        if hanzi in vi_cache:
            continue
        result = translate(hanzi)
        vi_cache[hanzi] = result or ''
        
        if (i + 1) % 50 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed
            eta = (total - i - 1) / rate
            done_vi = len([v for v in vi_cache.values() if v])
            with open(CACHE_JSON, 'w', encoding='utf-8') as f:
                json.dump(vi_cache, f, ensure_ascii=False)
            print(f"  {i+1}/{total} | {done_vi} with VI | {rate:.1f} w/s | ETA {eta/60:.0f}m", flush=True)

    # Build final output
    vi_count = 0
    for e in entries:
        vi = vi_cache.get(e['hanzi'], '')
        t = {}
        if vi:
            t['vi'] = vi
            vi_count += 1
        if e['en']:
            t['en'] = e['en']
        e['translations'] = t if t else None
        del e['en']

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    
    with open(CACHE_JSON, 'w', encoding='utf-8') as f:
        json.dump(vi_cache, f, ensure_ascii=False)
    
    print(f"\nDone! {vi_count}/{len(entries)} with Vietnamese", flush=True)

if __name__ == '__main__':
    main()
