# Hello Chinese Backend

## Quick start

1) Copy env file

```bash
cp .env.example .env
```

2) Install deps

```bash
npm install
```

3) Prisma generate

```bash
npm run prisma:generate
```

4) Run dev server

```bash
npm run start:dev
```

Server will start at `http://localhost:4000`.

## Tech stack

- NestJS + TypeScript
- PostgreSQL (Prisma)
- MinIO for media storage

## API docs

See [API.md](API.md).

---

## Example Sentences Pipeline

Generate 3 example sentences per vocabulary word with pinyin, Vietnamese translation, and audio:

```bash
# Step 1: Generate Chinese sentences + Vietnamese translations via LLM
npm run examples:generate

# Step 2: Generate pinyin for all sentences
npm run examples:pinyin

# Step 3: Generate TTS audio files
npm run examples:audio

# Step 4: Upload audio to MinIO + seed database
npm run examples:seed

# Or run all at once:
npm run examples:pipeline
```

**Environment variables** (add to `.env`):
- `ROUTER_API_KEY` — 9Router API key
- `ROUTER_API_BASE` — API endpoint (default: `https://9router.rehub.page/v1`)
- `EXAMPLES_MODEL` — Model name (default: `gemini/gemini-2.0-flash`)
