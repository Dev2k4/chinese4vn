#!/usr/bin/env python3
"""
Generate questions from HSK vocabulary data.
For each word: meaning_select, hanzi_select, pinyin_select.
Distractors from same level.
"""
import json
import os
import random
import re
from collections import defaultdict

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(DATA_DIR, "hsk30-vocab-translated.json")
OUTPUT = os.path.join(DATA_DIR, "hsk30-questions-generated.json")

random.seed(42)

def load_vocab():
    with open(INPUT, 'r', encoding='utf-8') as f:
        return json.load(f)

def build_distractor_pool(entries):
    """Group words by level for distractor selection."""
    pool = defaultdict(list)
    for e in entries:
        pool[e['level']].append(e)
    # Also create a global pool for levels with few words
    return pool

def pick_distractors(correct, pool, count=3):
    """Pick N distractors from pool excluding the correct entry."""
    candidates = [e for e in pool if e['hanzi'] != correct['hanzi']]
    random.shuffle(candidates)
    return candidates[:count]

def generate_meaning_question(entry, pool, qid):
    """Generate: show hanzi → pick correct Vietnamese meaning."""
    hanzi = entry['hanzi']
    pinyin = entry['pinyin']
    correct_vi = entry.get('translations', {}).get('vi', '')
    if not correct_vi:
        return None
    
    distractors = pick_distractors(entry, pool, 3)
    dist_vi = [d.get('translations', {}).get('vi', '') for d in distractors if d.get('translations', {}).get('vi', '')]
    
    # If not enough distractors from same level, try global
    if len(dist_vi) < 3:
        # fallback: pick from a different level
        extra_pool = [e for e in global_pool if e['hanzi'] != entry['hanzi']]
        random.shuffle(extra_pool)
        for e in extra_pool:
            vi = e.get('translations', {}).get('vi', '')
            if vi and vi != correct_vi and vi not in dist_vi:
                dist_vi.append(vi)
            if len(dist_vi) >= 3:
                break
    
    if len(dist_vi) < 3:
        return None  # Can't generate
    
    options = [correct_vi] + dist_vi[:3]
    random.shuffle(options)
    
    return {
        'id': f'q-vocab-ms-{qid:06d}',
        'type': 'meaning_select',
        'prompt': {'vi': f'Chọn nghĩa đúng của từ "{hanzi}"', 'en': f'Choose the correct meaning of "{hanzi}"'},
        'pinyin': pinyin,
        'options': options,
        'correctAnswer': correct_vi,
        'difficulty': entry.get('level', 1),
        'vocabularyHanzi': hanzi,
    }

def generate_hanzi_question(entry, pool, qid):
    """Generate: show Vietnamese meaning → pick correct hanzi."""
    hanzi = entry['hanzi']
    correct_vi = entry.get('translations', {}).get('vi', '')
    if not correct_vi:
        return None
    
    distractors = pick_distractors(entry, pool, 3)
    dist_hz = [d['hanzi'] for d in distractors]
    
    if len(dist_hz) < 3:
        extra_pool = [e for e in global_pool if e['hanzi'] != entry['hanzi']]
        random.shuffle(extra_pool)
        for e in extra_pool:
            if e['hanzi'] not in dist_hz:
                dist_hz.append(e['hanzi'])
            if len(dist_hz) >= 3:
                break
    
    if len(dist_hz) < 3:
        return None
    
    options = [hanzi] + dist_hz[:3]
    random.shuffle(options)
    
    return {
        'id': f'q-vocab-hz-{qid:06d}',
        'type': 'hanzi_select',
        'prompt': {'vi': f'Chọn hanzi đúng cho "{correct_vi}"', 'en': f'Choose the correct hanzi for "{correct_vi}"'},
        'options': options,
        'correctAnswer': hanzi,
        'difficulty': entry.get('level', 1),
        'vocabularyHanzi': hanzi,
    }

def generate_pinyin_question(entry, pool, qid):
    """Generate: show hanzi → pick correct pinyin."""
    hanzi = entry['hanzi']
    pinyin = entry['pinyin']
    if not pinyin:
        return None
    
    distractors = pick_distractors(entry, pool, 3)
    dist_py = [d['pinyin'] for d in distractors if d['pinyin']]
    
    if len(dist_py) < 3:
        extra_pool = [e for e in global_pool if e['hanzi'] != entry['hanzi']]
        random.shuffle(extra_pool)
        for e in extra_pool:
            if e['pinyin'] and e['pinyin'] not in dist_py and e['pinyin'] != pinyin:
                dist_py.append(e['pinyin'])
            if len(dist_py) >= 3:
                break
    
    if len(dist_py) < 3:
        return None
    
    options = [pinyin] + dist_py[:3]
    random.shuffle(options)
    
    return {
        'id': f'q-vocab-py-{qid:06d}',
        'type': 'pinyin_input',
        'prompt': {'vi': f'Chọn pinyin đúng của từ "{hanzi}"', 'en': f'Choose the correct pinyin for "{hanzi}"'},
        'pinyin': pinyin,
        'options': options,
        'correctAnswer': pinyin,
        'difficulty': entry.get('level', 1),
        'vocabularyHanzi': hanzi,
    }

def main():
    global global_pool
    print("Loading vocabulary...")
    entries = load_vocab()
    print(f"Total entries: {len(entries)}")
    
    level_pool = build_distractor_pool(entries)
    global_pool = entries
    
    questions = []
    stats = {'meaning_select': 0, 'hanzi_select': 0, 'pinyin_input': 0, 'skipped': 0}
    qid = 0
    
    for level in sorted(level_pool.keys()):
        pool = level_pool[level]
        print(f"  HSK {level}: {len(pool)} words...")
        
        for entry in pool:
            q1 = generate_meaning_question(entry, pool, qid)
            if q1:
                questions.append(q1)
                stats['meaning_select'] += 1
                qid += 1
            
            q2 = generate_hanzi_question(entry, pool, qid)
            if q2:
                questions.append(q2)
                stats['hanzi_select'] += 1
                qid += 1
            
            q3 = generate_pinyin_question(entry, pool, qid)
            if q3:
                questions.append(q3)
                stats['pinyin_input'] += 1
                qid += 1
            
            if not q1 and not q2 and not q3:
                stats['skipped'] += 1
    
    print(f"\nGenerated: {len(questions)} questions")
    print(f"  meaning_select: {stats['meaning_select']}")
    print(f"  hanzi_select: {stats['hanzi_select']}")
    print(f"  pinyin_input: {stats['pinyin_input']}")
    print(f"  skipped: {stats['skipped']}")
    
    # Group by level for stats
    by_level = defaultdict(int)
    for q in questions:
        by_level[q['difficulty']] += 1
    print("\nBy level:")
    for lvl in sorted(by_level):
        print(f"  HSK {lvl}: {by_level[lvl]} questions")
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to {OUTPUT}")

if __name__ == '__main__':
    main()
