"""
Step 1: Generate example sentences + Vietnamese translations using 9router API (OpenAI-compatible).
Input:  PostgreSQL vocabulary table
Output: data/examples_raw.json  [{vocabId, hanzi, pinyin, translations, hskLevel, examples: [{sentence, translation, order}]}]

Resume support: saves progress after each batch. Re-run to continue from last checkpoint.
"""

import json
import os
import sys
import time
import psycopg2
from datetime import datetime
from openai import OpenAI
from pathlib import Path

# ── CONFIG ──────────────────────────────────────────────────────
API_KEY = os.environ.get("ROUTER_API_KEY", "sk-39fae8997490725b-63kyem-fe24db28")
API_BASE = os.environ.get("ROUTER_API_BASE", "https://9router.rehub.page/v1")
MODEL = os.environ.get("EXAMPLES_MODEL", "gemini/gemini-2.5-flash")
BATCH_SIZE = 10            # vocab words per API request (→ 30 sentences)
MAX_RETRIES = 5
CHECKPOINT_FILE = Path(__file__).parent / "examples_raw.json"
DB_CONN = os.environ.get("DATABASE_URL", "postgresql://postgres:Hieu2004%40@localhost:5433/hello_chinese")
REQUEST_DELAY = 8           # seconds between requests (respect rate limit)
# ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Bạn là trợ lý tạo câu ví dụ tiếng Trung cho người Việt.

QUY TẮC:
- Câu tiếng Trung ngắn gọn (≤15 chữ), tự nhiên, phù hợp trình độ HSK
- Dịch tiếng Việt chính xác
- KHÔNG thêm pinyin, KHÔNG giải thích, CHỈ trả về JSON

ĐỊNH DẠNG ĐẦU RA (JSON array, không markdown):
[{"hanzi":"từ gốc","examples":[{"sentence":"câu tiếng Trung","translation":"dịch Việt"},{"sentence":"...","translation":"..."},{"sentence":"...","translation":"..."}]}]"""


def get_db():
    return psycopg2.connect(DB_CONN)


def fetch_vocab():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT v.id, v.hanzi, v.pinyin, v.translations->>'vi' as meaning_vi,
                       cl.level as hsk_level
                FROM "Vocabulary" v
                JOIN "CourseLevel" cl ON cl.id = v."levelId"
                WHERE v."isActive" = true
                ORDER BY cl.level, v.order
            """)
            rows = cur.fetchall()
        print(f"  Loaded {len(rows)} vocabulary words")
        return [
            {
                "vocabId": r[0],
                "hanzi": r[1],
                "pinyin": r[2],
                "meaningVi": r[3] or "",
                "hskLevel": r[4],
            }
            for r in rows
        ]
    finally:
        conn.close()


def build_prompt(batch):
    lines = []
    for w in batch:
        lines.append(
            f'{w["hanzi"]}|{w["meaningVi"]}|HSK{w["hskLevel"]}'
        )
    return (
        "Tạo 3 câu ví dụ cho mỗi từ sau. Trả về JSON array đúng định dạng:\n\n"
        + "\n".join(lines)
    )


def parse_response(text: str) -> list | None:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        text = text.rsplit("```", 1)[0]
    text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, list):
        return None
    for item in data:
        if "examples" not in item or not isinstance(item["examples"], list):
            return None
        for ex in item["examples"]:
            if "sentence" not in ex or "translation" not in ex:
                return None
    return data


def call_api(client, batch, batch_index, total_batches):
    prompt = build_prompt(batch)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=4096,
            )
            content = resp.choices[0].message.content.strip()
            if not content:
                raise ValueError("Empty response")

            parsed = parse_response(content)
            if parsed is None:
                print(f"  ⚠ Batch {batch_index}/{total_batches}: parse fail, retry {attempt}/{MAX_RETRIES}")
                time.sleep(2 ** attempt)
                continue

            return parsed

        except Exception as e:
            print(f"  ⚠ Batch {batch_index}/{total_batches}: {e}, retry {attempt}/{MAX_RETRIES}")
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)

    print(f"  ✗ Batch {batch_index}/{total_batches}: FAILED after {MAX_RETRIES} retries")
    return None


def load_checkpoint():
    if CHECKPOINT_FILE.exists():
        data = json.loads(CHECKPOINT_FILE.read_text())
        print(f"  Loaded checkpoint: {len(data)} words already done")
        return data
    return []


def save_checkpoint(results):
    CHECKPOINT_FILE.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  💾 Saved checkpoint: {len(results)} words")


def main():
    print("=" * 60)
    print("  STEP 1: Generate Example Sentences (9Router API)")
    print(f"  Model: {MODEL}")
    print(f"  Batch size: {BATCH_SIZE} words/request")
    print(f"  Output: {CHECKPOINT_FILE}")
    print("=" * 60)

    client = OpenAI(api_key=API_KEY, base_url=API_BASE)

    print("\n[1/3] Fetching vocabulary from DB...")
    all_vocab = fetch_vocab()
    total = len(all_vocab)

    print("\n[2/3] Loading checkpoint...")
    results = load_checkpoint()
    done_ids = {r["vocabId"] for r in results}

    remaining = [w for w in all_vocab if w["vocabId"] not in done_ids]
    total_batches = (len(remaining) + BATCH_SIZE - 1) // BATCH_SIZE
    already_done = len(done_ids)

    print(f"  Already done: {already_done}/{total}")
    print(f"  Remaining: {len(remaining)} words → {total_batches} batches")

    if not remaining:
        print("\n✅ All done!")
        return

    print(f"\n[3/3] Generating examples ({total_batches} batches)...")
    start_time = time.time()
    batches_processed = 0

    for i in range(0, len(remaining), BATCH_SIZE):
        batch = remaining[i : i + BATCH_SIZE]
        batch_num = batches_processed + 1

        print(f"\n  Batch {batch_num}/{total_batches} "
              f"({batch[0]['hanzi']}..{batch[-1]['hanzi']}) ...", end=" ")

        parsed = call_api(client, batch, batch_num, total_batches)
        if parsed is None:
            print("  [SKIP]")
            continue

        # Match parsed results to vocab words
        hanzi_map = {w["hanzi"]: w for w in batch}
        for item in parsed:
            hanzi = item.get("hanzi", "")
            if hanzi not in hanzi_map:
                # Try fuzzy match
                for h, w in hanzi_map.items():
                    if h in hanzi or hanzi in h:
                        hanzi = h
                        break
                else:
                    print(f"\n  ⚠ Word '{hanzi}' not found in batch, skipping")
                    continue

            w = hanzi_map[hanzi]
            entry = {
                "vocabId": w["vocabId"],
                "hanzi": w["hanzi"],
                "pinyin": w["pinyin"],
                "translations": {"vi": w["meaningVi"]},
                "hskLevel": w["hskLevel"],
                "examples": [
                    {
                        "sentence": ex["sentence"].strip().rstrip("，,。."),
                        "translation": ex["translation"].strip(),
                        "order": idx + 1,
                    }
                    for idx, ex in enumerate(item.get("examples", [])[:3])
                ],
            }
            results.append(entry)

        batches_processed += 1

        # Save checkpoint every 10 batches
        if batches_processed % 10 == 0:
            save_checkpoint(results)

        # Rate limiting
        if batch_num < total_batches:
            time.sleep(REQUEST_DELAY)

    save_checkpoint(results)

    elapsed = time.time() - start_time
    total_examples = sum(len(r["examples"]) for r in results)
    print(f"\n{'=' * 60}")
    print(f"  ✅ DONE in {elapsed/60:.1f} minutes")
    print(f"  Total words processed: {len(results)}")
    print(f"  Total examples generated: {total_examples}")
    print(f"  Output: {CHECKPOINT_FILE}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
