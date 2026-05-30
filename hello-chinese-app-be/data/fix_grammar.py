#!/usr/bin/env python3
"""
Fix grammar seed data: replace Chinese text in vi fields with meaningful fallbacks.
"""
import json
import os
import re

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(DATA_DIR, "hsk30-grammar-seed-ready.json")
OUTPUT = os.path.join(DATA_DIR, "hsk30-grammar-seed-ready.json")

HSK_NAMES = {
    1: "Cơ bản",
    2: "Sơ cấp", 
    3: "Trung cấp",
    4: "Trung cấp cao",
    5: "Cao cấp",
    6: "Cao cấp",
    7: "Thông thạo",
}

GTYPE_VI = {
    "词类": "Từ loại",
    "句子成分": "Thành phần câu",
    "句子类型": "Loại câu",
    "复句": "Câu phức",
    "特殊句式": "Cấu trúc đặc biệt",
    "固定格式": "Cấu trúc cố định",
    "语素": "Hình vị",
    "修辞": "Tu từ",
    "短语": "Cụm từ",
    "句子的类型": "Loại câu",
    "句子的成分": "Thành phần câu",
    "词类/语素": "Từ loại/Hình vị",
    "固定格式/短语": "Cấu trúc cố định/Cụm từ",
}

GTYPE_EXPL_EN = {
    "词类": "Part of Speech",
    "句子成分": "Sentence Component",
    "句子类型": "Sentence Type",
    "复句": "Complex Sentence",
    "特殊句式": "Special Construction",
    "固定格式": "Fixed Pattern",
    "语素": "Morpheme",
    "修辞": "Rhetoric",
    "短语": "Phrase",
    "句子的类型": "Sentence Types",
    "句子的成分": "Sentence Components",
    "词类/语素": "Parts of Speech / Morphemes",
    "固定格式/短语": "Fixed Patterns / Phrases",
}

def has_chinese(s):
    if not s:
        return False
    return bool(re.search(r'[\u4e00-\u9fff]', s))

def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} grammar entries")
    
    for i, e in enumerate(data):
        level = e.get('level', 1)
        gtype = e.get('grammarType', '')
        title = e.get('title', {})
        explanation = e.get('explanation', {})
        structure = e.get('structure', {})
        
        # Fix title vi: use en (usually Chinese grammar term) as display name
        title_vi = title.get('vi', '')
        title_en = title.get('en', '')
        if has_chinese(title_vi) or not title_vi:
            if title_en and not has_chinese(title_en):
                title['vi'] = title_en
            else:
                title['vi'] = title_en  # Chinese grammar terms are commonly used as-is
        
        # Fix explanation vi: use gtype description fallback
        expl_vi = explanation.get('vi', '')
        expl_en = explanation.get('en', '')
        if has_chinese(expl_vi) or not expl_vi:
            gtype_vi = GTYPE_VI.get(gtype, '')
            if not gtype_vi or has_chinese(gtype_vi):
                gtype_vi = GTYPE_EXPL_EN.get(gtype, '')
            if expl_en and not has_chinese(expl_en):
                explanation['vi'] = expl_en
            else:
                explanation['vi'] = f"Điểm ngữ pháp HSK {level} - {gtype_vi}" if gtype_vi else f"Điểm ngữ pháp HSK {level}"
                explanation['en'] = f"Grammar Point HSK {level}" + (f" - {GTYPE_EXPL_EN.get(gtype, '')}" if GTYPE_EXPL_EN.get(gtype, '') else '')
        
        # Fix structure vi: use the Chinese grammar term directly
        struct_vi = structure.get('vi', '')
        struct_en = structure.get('en', '')
        if has_chinese(struct_vi) or not struct_vi:
            if struct_en and not has_chinese(struct_en):
                structure['vi'] = struct_en
            else:
                structure['vi'] = title.get('en', title.get('vi', ''))
                structure['en'] = title.get('en', '')
        
        # Fix title en if still Chinese
        if title.get('en') and has_chinese(title['en']):
            title['en'] = f"Grammar Point {i+1}"
        
        # Fix examples - remove empty translations, set placeholder pinyin
        for ex in e.get('examples', []):
            if not ex.get('pinyin'):
                ex['pinyin'] = '(đang cập nhật...)'
            tr = ex.get('translations', {})
            if not tr.get('vi'):
                tr['vi'] = '(đang cập nhật...)'
            if not tr.get('en'):
                tr['en'] = '(updating...)'
    
    # Count stats
    bad_expl = sum(1 for e in data if has_chinese(e.get('explanation', {}).get('vi', '')))
    bad_struct = sum(1 for e in data if has_chinese(e.get('structure', {}).get('vi', '')))
    bad_title = sum(1 for e in data if has_chinese(e.get('title', {}).get('vi', '')))
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Fixed grammar data")
    print(f"  Remaining Chinese in title: {bad_title}")
    print(f"  Remaining Chinese in explanation: {bad_expl}")
    print(f"  Remaining Chinese in structure: {bad_struct}")

if __name__ == '__main__':
    main()
