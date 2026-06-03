#!/usr/bin/env python3
"""
Translate a batch of N words, resuming from cache.
Usage: python3 translate_batch.py [COUNT]
Default COUNT: 2000
"""

import json
import os
import sys
import time

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-en.json")
CACHE_JSON = os.path.join(DATA_DIR, "vi_cache.json")
OUTPUT_JSON = os.path.join(DATA_DIR, "hsk30-vocab-translated.json")

from urllib.parse import quote
from http.client import HTTPSConnection

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
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
    entries = json.load(open(INPUT_JSON, 'r', encoding='utf-8'))
    cache = json.load(open(CACHE_JSON, 'r', encoding='utf-8')) if os.path.exists(CACHE_JSON) else {}
    
    missing = list(dict.fromkeys([e['hanzi'] for e in entries if e['hanzi'] not in cache]))
    to_do = min(count, len(missing))
    print(f"Translating {to_do}/{len(missing)} remaining words", flush=True)
    
    start = time.time()
    for i in range(to_do):
        hanzi = missing[i]
        r = translate(hanzi)
        cache[hanzi] = r or ''
        if (i+1) % 100 == 0:
            json.dump(cache, open(CACHE_JSON, 'w'), ensure_ascii=False)
            rate = (i+1) / (time.time() - start)
            eta = (to_do - i - 1) / rate
            print(f"  {i+1}/{to_do} | {rate:.1f} w/s | ETA {eta/60:.0f}m", flush=True)
    
    json.dump(cache, open(CACHE_JSON, 'w'), ensure_ascii=False)
    print(f"Batch done. Total cached: {len(cache)}", flush=True)

if __name__ == '__main__':
    main()
